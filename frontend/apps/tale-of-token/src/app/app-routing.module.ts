import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { HomePageComponent } from './home/home.page';
import { ShopPageComponent } from './shop/shop.component';
import { authGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
    {
        path: 'home',
        component: HomePageComponent,
        canActivate: [authGuard] // Utilisation du guard fonctionnel
    },
    {
        path: 'shop',
        component: ShopPageComponent,
        canActivate: [authGuard] // Utilisation du guard fonctionnel
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: 'login',
        component: LoginComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
