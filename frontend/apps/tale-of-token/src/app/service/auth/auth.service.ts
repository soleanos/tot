import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Web3 from 'web3';


@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private web3: Web3;
    constructor(private afAuth: AngularFireAuth) {
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
            const message = `Sign this message to authenticate with this app: ${new Date().toISOString()}`;

            const signature = await this.web3.eth.personal.sign(message, address, '');
            const response = await fetch('https://YOUR_CLOUD_FUNCTION_URL', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address, signature, message }),
            });

            const { customToken } = await response.json();
            await this.afAuth.signInWithCustomToken(customToken);
            console.log("User signed in with MetaMask");
        } catch (error) {
            console.error("Error during MetaMask sign in: ", error);
        }
    }
}
