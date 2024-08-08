import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Web3 from 'web3';
import firebase from 'firebase/compat';
import { Auth,  getAuth, signInWithCustomToken  } from '@angular/fire/auth';


@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private web3: Web3;
    constructor() {
        if ((window as any).ethereum) {
            this.web3 = new Web3((window as any).ethereum);
        } else if ((window as any).web3) {
            this.web3 = new Web3((window as any).web3.currentProvider);
        } else {
            console.error("Non-Ethereum browser detected. You should consider trying MetaMask!");
        }
    }

    async signInWithMetaMask(): Promise<void> {
        try {
            const accounts = await this.web3.eth.getAccounts();
            const address = accounts[0];

            const nonceResponse = await fetch(' https://getnonce-lgimcfkedq-ew.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address }),
            });

            if (!nonceResponse.ok) {
                const errorText = await nonceResponse.text();
                console.error("Error fetching nonce:", nonceResponse.status, errorText);
                return;
            }

            const { nonce } = await nonceResponse.json();
            console.log("Received nonce from server:", nonce); // Log de débogage

            const message = "Accepter de vous authentifier sur le jeux Tale of Token";
            const signature = await this.web3.eth.personal.sign(message, address, '');

            const response = await fetch('https://authenticatemetamask-lgimcfkedq-ew.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address, signature, message }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error authenticating:", response.status, errorText);
                return;
            }

            const { customToken } = await response.json();
            const auth = getAuth();
            await signInWithCustomToken(auth, customToken);
            console.log("User signed in with MetaMask");
        } catch (error) {
            console.error("Error during MetaMask sign in: ", error);
        }
    }
}
