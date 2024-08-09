import { Inject, inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Web3 from 'web3';
import firebase from 'firebase/compat';
import { Auth, getAuth, onAuthStateChanged, signInWithCustomToken, signOut } from '@angular/fire/auth';
import { doc, Firestore, getDoc, getFirestore } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import User = firebase.User;


@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private web3: Web3;
    private usernameSubject = new BehaviorSubject<string | null>(null);
    username$ = this.usernameSubject.asObservable();

    constructor(private auth: Auth,  @Inject(Firestore) private firestore: Firestore) {
        console.log('Firestore instance:', this.firestore);

        if ((window as any).ethereum) {
            this.web3 = new Web3((window as any).ethereum);
        } else if ((window as any).web3) {
            this.web3 = new Web3((window as any).web3.currentProvider);
        } else {
            console.error("Non-Ethereum browser detected. You should consider trying MetaMask!");
        }
        this.initAuthListener(); // Déplacement de la logique dans une méthode dédiée
    }

    private initAuthListener(): void {
        onAuthStateChanged(this.auth, async (user: User | null) => {
            if (user) {
                console.log('User ID:', user.uid);
                const docPath = `users/${user.uid}`;
                console.log('Document Path:', docPath);

                console.log('Type of Firestore instance:', typeof this.firestore);
                console.log('Is Firestore instance:', this.firestore instanceof Firestore);
                const testFirestore: Firestore = this.firestore;
                console.log('Test Firestore instance:', testFirestore);
                console.log('Is Firestore instance:', testFirestore instanceof Firestore);

                try {
                    const userDocRef = doc(this.firestore, "cities", user.uid);

                    console.log('Document Reference:', userDocRef);

                    const userDoc = await getDoc(userDocRef);

                    console.log('User Document:', userDoc.exists() ? userDoc.data() : 'No document found');

                    if (userDoc.exists()) {
                        this.usernameSubject.next(userDoc.data()?.['username'] || null);
                    } else {
                        console.error('No user document found');
                        this.usernameSubject.next(null);
                    }
                } catch (error) {
                    console.error('Error fetching user document:', error);
                    this.usernameSubject.next(null);
                }
            } else {
                this.usernameSubject.next(null);
            }
        });
    }

    async signInWithMetaMask(): Promise<void> {
        try {
            const accounts = await this.web3.eth.getAccounts();
            const address = accounts[0];

            const nonceResponse = await fetch('https://getnonce-lgimcfkedq-ew.a.run.app', {
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

            const message = "Accepter de vous authentifier sur le jeu Tale of Token";
            const signature = await this.web3.eth.personal.sign(message, address, '');

            const response = await fetch('https://authenticatemetamask-lgimcfkedq-ew.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Nonce': nonce, // Envoyer le nonce dans l'en-tête
                },
                body: JSON.stringify({ address, signature, message }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error authenticating:", response.status, errorText);
                return;
            }

            const { customToken } = await response.json();
            await signInWithCustomToken(this.auth, customToken);
            console.log("User signed in with MetaMask");
        } catch (error) {
            console.error("Error during MetaMask sign in: ", error);
        }
    }

    // Méthode pour déconnecter l'utilisateur
    async logout(): Promise<void> {
        try {
            await signOut(this.auth);
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    }
}
