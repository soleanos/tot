import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { map, take, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);

    return user(auth).pipe(
        take(1),
        map(currentUser => !!currentUser),
        tap(loggedIn => {
            if (!loggedIn) {
                console.log('Access denied - Redirecting to login');
                router.navigate(['/login']);
            }
            // Supprime cette partie pour éviter la redirection circulaire
        })
    );
};
