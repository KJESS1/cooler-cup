import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { execSync } from "child_process";

async function deploy() {
    const RAW_KEY = process.argv[2];
    if (!RAW_KEY) {
        console.error("Error: pass your private key as an argument.");
        return;
    }

    const keypair = Ed25519Keypair.fromSecretKey(RAW_KEY);
    const targetAddress = keypair.toSuiAddress();
    console.log(`Address: ${targetAddress}`);

    console.log("Compiling with sui CLI...");
    const buildOutput = execSync(
        `sui move build --dump-bytecode-as-base64 --path .`,
        { encoding: "utf8" }
    );
    const { modules, dependencies } = JSON.parse(buildOutput);
    console.log(`Compiled ${modules.length} module(s).`);

    const client = new SuiClient({ url: getFullnodeUrl("testnet") });
    const tx = new Transaction();
    const [upgradeCap] = tx.publish({ modules, dependencies });
    tx.transferObjects([upgradeCap], targetAddress);

    console.log("Broadcasting...");
    const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showObjectChanges: true, showEffects: true },
    });

    if (result.effects?.status?.status !== "success") {
        console.error("DEPLOYMENT FAILED:", JSON.stringify(result.effects?.status));
        return;
    }

    console.log("DEPLOYMENT SUCCESSFUL");
    let packageId = "";
    let adminCapId = "";
    result.objectChanges.forEach(change => {
        if (change.type === "published") packageId = change.packageId;
        else if (change.type === "created" && change.objectType.includes("AdminCap")) adminCapId = change.objectId;
        else if (change.type === "created" && change.objectType.includes("UpgradeCap") && !adminCapId) adminCapId = change.objectId;
    });

    console.log(`PACKAGE_ID: ${packageId}`);
    console.log(`ADMIN_CAP_ID: ${adminCapId}`);
}

deploy().catch(err => console.error("Script error:", err.message));
