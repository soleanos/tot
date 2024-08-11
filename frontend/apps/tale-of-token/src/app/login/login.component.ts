import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth/auth.service';
import { Auth, onAuthStateChanged, user } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'openforge-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent  implements OnInit {

  constructor(private authService: AuthService, private auth: Auth, private router: Router) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (currentUser) => {
        if (currentUser) {
            this.router.navigate(['/google.fr']);
        }
    });
  }

  loginWithGoogle() {
    this.authService.signInWithMetaMask();
  }

  loginWithFacebook() {
    this.authService.signInWithMetaMask();
  }

  loginWithGitHub() {
    this.authService.signInWithMetaMask();
  }

  loginWithMetaMask() {
    this.authService.signInWithMetaMask();
  }


}
