 import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
 import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
 import { Transaction } from "@mysten/sui/transactions";
 import { execSync } from "child_process";

 async function deploy() {
     const RAW_KEY = process.argv[2]; 
     if (!RAW_KEY) {
         console.error("❌ Error: You forgot to type your private key after the command!");
         return;
     }

     console.log("🚀 Restoring your Slush deployment wallet...");
     const keypair = Ed25519Keypair.fromSecretKey(RAW_KEY);
     const targetAddress = keypair.toSuiAddress();
     console.log(`🔑 Connected Address: ${targetAddress}`);

     console.log("\n🛠️ Extracting clean binary bytecode configurations...");
     let buildOutput;
     try {
         buildOutput = execSync(`$HOME/.local/bin/sui move build --dump-bytecode-as-base64`, { env: process.env }).toString();
     } catch {
         buildOutput = execSync(`sui move build --dump-bytecode-as-base64`, { env: process.env }).toString();
     }

     // FIX: Isolates the raw JSON string data by stripping out the preceding compiler and linter warning blocks
     const jsonStartIndex = buildOutput.indexOf("{");
     if (jsonStartIndex === -1) {
         console.error("❌ Error: Compiler output did not contain valid object blocks!\nDetails: " + buildOutput);
         return;
     }
     const cleanJson = buildOutput.substring(jsonStartIndex);
     const buildData = JSON.parse(cleanJson);
     console.log("✅ Bytecode successfully filtered and loaded!");

     const client = new SuiClient({ url: getFullnodeUrl("testnet") });
     console.log("📦 Packaging modules for Testnet publication...");
     const tx = new Transaction();

     const [upgradeCap] = tx.publish({
         modules: buildData.modules,
         dependencies: buildData.dependencies,
     });
     tx.transferObjects([upgradeCap], targetAddress);

     tx.setGasBudget(120000000); 

     console.log("🚀 Broadcasting transaction using your Slush tokens...");
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
