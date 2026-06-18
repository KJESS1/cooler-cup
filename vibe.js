import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { fromB64 } from "@mysten/sui/utils";
import { execSync } from "child_process";

async function deploy() {
    const RAW_KEY = process.argv[2]; 
    if (!RAW_KEY) {
        console.error("❌ Error: You forgot to type your private key after the command!");
        return;
    }

    console.log("🚀 Restoring your Slush deployment wallet...");
    let keypair;
    try {
        if (RAW_KEY.startsWith("suiprivkey")) {
            keypair = Ed25519Keypair.fromSecretKey(RAW_KEY);
        } else {
            let secretKeyBytes;
            try { secretKeyBytes = fromB64(RAW_KEY); } 
            catch { secretKeyBytes = Uint8Array.from(Buffer.from(RAW_KEY.replace("0x", ""), "hex")); }
            if (secretKeyBytes.length === 64) secretKeyBytes = secretKeyBytes.slice(0, 32);
            keypair = Ed25519Keypair.fromSecretKey(secretKeyBytes);
        }
    } catch (err) {
        console.error("❌ Key import failed! Check your private key string format.");
        return;
    }

    const targetAddress = keypair.toSuiAddress();
    console.log(`🔑 Connected Address: ${targetAddress}`);
    const client = new SuiClient({ url: getFullnodeUrl("testnet") });

    console.log("\n🛠️ Compiling Move package to bytecode via local workspace dependencies...");
    let base64Modules = [];
    let base64Deps = [];
    
    try {
        const buildOutput = execSync(`npx @mysten/sui move build --dump-bytecode-as-base64 --path ./move`).toString();
        const buildData = JSON.parse(buildOutput);
        base64Modules = buildData.modules;
        base64Deps = buildData.dependencies;
    } catch {
        console.log("🔄 Alternative directory check...");
        const buildOutput = execSync(`npx @mysten/sui move build --dump-bytecode-as-base64`).toString();
        const buildData = JSON.parse(buildOutput);
        base64Modules = buildData.modules;
        base64Deps = buildData.dependencies;
    }

    console.log("📦 Publishing contract directly to Testnet using your Slush tokens...");
    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
        modules: base64Modules,
        dependencies: base64Deps,
    });
    tx.transferObjects([upgradeCap], targetAddress);

    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showObjectChanges: true },
    });

    console.log("\n🎉 --- DEPLOYMENT SUCCESSFUL ---");
    let packageId = "";
    let adminCapId = "";
    
    result.objectChanges.forEach(change => {
        if (change.type === "published") {
            packageId = change.packageId;
        } else if (change.type === "created" && change.objectType.includes("AdminCap")) {
            adminCapId = change.objectId;
        } else if (change.type === "created" && change.objectType.includes("UpgradeCap") && !adminCapId) {
            adminCapId = change.objectId;
        }
    });

    console.log(`\n📬 SUCCESS! COPY THESE INTO YOUR REPLIT SECRETS TAB:`);
    console.log(`PACKAGE_ID: ${packageId}`);
    console.log(`ADMIN_CAP_ID: ${adminCapId}`);
    console.log(`ADMIN_PRIVATE_KEY: ${RAW_KEY}`);
}

deploy().catch(console.error);
