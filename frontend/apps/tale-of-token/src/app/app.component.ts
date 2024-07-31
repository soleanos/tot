/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Event, Warrior } from '@soleano/shared/data-access-model';
import { PhaserSingletonService } from '@soleano/shared-phaser-singleton';

import { ShopPageComponent } from './shop/shop.component';
import { AuthService } from './service/auth/auth.service';
import Web3 from 'web3';

@Component({
    selector: 'openforge-app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
    public actionsHistoryRef: string[]; // * Store all actions on home screen for printing
    public warriors: Warrior[] = []; // * Array of Warriors since they don't currently have a graphic associated
    web3: Web3;
    account: string;

    // * for our app template to use the actions History)
    constructor(public phaserInstance: PhaserSingletonService, public modalController: ModalController, private authService: AuthService) {
        this.actionsHistoryRef = PhaserSingletonService.actionsHistory;
    }

    public async openShop(): Promise<void> {
        const modal = await this.modalController.create({
            component: ShopPageComponent,
            cssClass: 'fullscreen',
        });
        return await modal.present();
    }


    /**
     * * Creates a warrior to be placed on scene
     */
    public async createWarrior(): Promise<void> {
        console.log('createWarrior()');
        const tmpWarrior = await Warrior.build(new Warrior());
        this.warriors.push(tmpWarrior);
    }

    /**
     * * Creates a Event and applies it to the Warrior
     *
     * @param _warrior Warrior
     */
    public async doPushUps(_warrior: Warrior): Promise<void> {
        await _warrior.doPushUps();
    }

    /**
     * * Creates a Event and applies it to a random Warrior
     */
    public async createEvent(): Promise<void> {
        // * This function creates an 'experience' event that modifies the Warrior
        const xpEvent = new Event();
        console.log('createEvent()', 'value = ', xpEvent.value);
    }

    /**
     * * Need to handle the destroy method so we dont lock up our computer!
     */
    ngOnDestroy(): void {
        PhaserSingletonService.destroyActiveGame();
    }

    signInWithMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            // MetaMask is available
            this.web3 = new Web3(window.ethereum);
            console.log('MetaMask is installed!');
        } else {
            console.error('MetaMask is not installed. Please install it to use this app.');
        }
        this.connectMetaMask();
        this.authService.signInWithMetaMask();
    }

    async connectMetaMask() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Request account access if needed
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const accounts = await this.web3.eth.getAccounts();
                this.account = accounts[0];
                console.log(`Connected to MetaMask account: ${this.account}`);
            } else {
                console.error('MetaMask is not installed. Please install it to use this app.');
            }
        } catch (error) {
            console.error('User denied account access', error);
        }
    }
}
