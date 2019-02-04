import {Inject, Injectable} from '@angular/core';
import {of as observableOf, Observable, ReplaySubject, Subject} from 'rxjs';
import { filter } from "rxjs/operators";
import {OidcProvider} from './oidc/oidc.provider';
import {AUTH_PROVIDER_TOKEN, AuthProvider, Token} from './auth.provider';
import {SitefinityService} from '../services/sitefinity.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private provider: AuthProvider = null;
  private currentToken: Token = null;

  constructor(@Inject(AUTH_PROVIDER_TOKEN) private oidcProvider: OidcProvider, private sitefinity: SitefinityService) { }

  init(): Observable<any> {
    if(this.provider) {
      return observableOf(this.provider);
    }

    return this.getProvider();
  }

  signIn(returnUrl: string): Observable<void> {
    return this.provider.signIn(returnUrl);
  }

  isLoggedIn(): Observable<boolean> {
    if (!this.provider) {
      return observableOf(false);
    }

    return this.provider.isLoggedIn();
  }

  getProvider(): Observable<AuthProvider> {
    let availableProv = null;
    const ready = new ReplaySubject<AuthProvider>(1);

    if (this.oidcProvider.isAvailable()) {
        availableProv = this.oidcProvider;
    }

    this.initProvider(ready, availableProv);
    return ready.asObservable();
  }

  initProvider(ready: Subject<AuthProvider>, provider: AuthProvider) {
    this.provider = provider;
    this.provider.getToken().pipe(filter(x => !!x)).subscribe((token) => {
      this.currentToken = token;
      this.sitefinity.token = {
        type: token.type,
        value: token.value
      };
    });

    ready.next(this.provider);
    ready.complete();
  }
}