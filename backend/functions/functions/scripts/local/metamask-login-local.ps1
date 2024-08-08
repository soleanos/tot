# Changez de répertoire pour les fonctions
cd functions

# Compilation du code TypeScript
npm run build

# Démarrage des émulateurs Firebase
firebase emulators:start &

# Attendre quelques secondes pour que les émulateurs démarrent
Start-Sleep -Seconds 10

# Génération des clés de test
Write-Output "Génération des clés de test..."
$keys = node scripts/generateKeys.js | ConvertFrom-Json

# Extraction des clés de la sortie
$address = $keys.address
$privateKey = $keys.privateKey

# Affichage des clés générées
Write-Output "Adresse Ethereum: $address"
Write-Output "Clé Privée: $privateKey"

# Appel à getNonce pour récupérer le nonce
Write-Output "Appel à getNonce pour récupérer le nonce..."
$response = Invoke-WebRequest -Uri http://127.0.0.1:5001/tot-poc/europe-west1/getNonce -Method POST -Headers @{ "Content-Type" = "application/json" } -Body ("{`"address`": `"$address`"}")

# Extraction du nonce de la réponse
$nonce = ($response.Content | ConvertFrom-Json).nonce

# Affichage du nonce pour vérification
Write-Output "Nonce reçu: $nonce"

# Utilisation de Node.js pour signer le nonce (simuler MetaMask)
Write-Output "Signature du nonce avec la clé privée de test..."
$signature = node scripts/signMessage.js $privateKey $nonce

# Appel à authenticateMetaMask avec l'adresse, le nonce et la signature
Write-Output "Appel à authenticateMetaMask..."
$responseAuth = Invoke-WebRequest -Uri http://127.0.0.1:5001/tot-poc/europe-west1/authenticateMetaMask -Method POST -Headers @{ "Content-Type" = "application/json" } -Body ("{`"address`": `"$address`", `"signature`": `"$signature`", `"message`": `"$nonce
