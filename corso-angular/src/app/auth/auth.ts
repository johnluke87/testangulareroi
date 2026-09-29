import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  isLoggedIn: boolean = false;
  isAuthenticated() {
    return this.isLoggedIn;
  }
}
