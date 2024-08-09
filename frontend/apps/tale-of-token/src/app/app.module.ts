/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { PhaserSingletonService } from '@soleano/shared-phaser-singleton';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomePageComponent } from './home/home.page';
import { ReversePipe } from './pipes/reverse.pipe';
import { ShopPageComponent } from './shop/shop.component';
import { CommonModule } from '@angular/common';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';

import { environment } from '../environments/environment';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

@NgModule({
    declarations: [AppComponent, ShopPageComponent, HomePageComponent, ReversePipe],
    imports: [BrowserModule, CommonModule, IonicModule.forRoot(), PhaserSingletonService.forRoot(),
        AppRoutingModule,
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore(getApp()))
    ],
    providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add this line
})
export class AppModule {}
