// test-moveai.ts - Interactive test file
import * as readline from 'readline';

interface MoveCodeExample {
  pattern: string;
  template: string;
  description: string;
}

interface MoveContext {
  modules: string[];
  structs: string[];
  functions: string[];
}

class MoveAI {
  private movePatterns: MoveCodeExample[];
  private context: MoveContext;

  constructor() {
    this.context = {
      modules: [],
      structs: [],
      functions: []
    };

    this.movePatterns = [
      {
        pattern: "create_module",
        template: `module {{address}}::{{module_name}} {
    use std::signer;
    
    // Module code here
}`,
        description: "Creates a basic Move module structure"
      }
    ];
  }

  generateCode(intent: string, params: Record<string, string> = {}): string {
    const intentLower = intent.toLowerCase();

    if (intentLower.includes('token') || intentLower.includes('coin')) {
      return this.generateTokenContract(params);
    } else if (intentLower.includes('nft')) {
      return this.generateNFTContract(params);
    } else if (intentLower.includes('marketplace')) {
      return this.generateMarketplace(params);
    } else if (intentLower.includes('module')) {
      return this.generateModule(params);
    }

    return "// Unable to generate code. Try: 'create a token', 'create an nft', 'create a marketplace'";
  }

  private generateModule(params: Record<string, string>): string {
    const moduleName = params.name || "MyModule";
    const address = params.address || "0x1";

    return `module ${address}::${moduleName} {
    use std::signer;

    const E_NOT_AUTHORIZED: u64 = 1;

    struct Data has key {
        value: u64
    }

    public fun initialize(account: &signer) {
        move_to(account, Data { value: 0 });
    }
}`;
  }

  private generateTokenContract(params: Record<string, string>): string {
    const moduleName = params.name || "MyToken";
    const address = params.address || "0x1";

    return `module ${address}::${moduleName} {
    use std::signer;
    use std::string::String;

    const E_NOT_INITIALIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 3;

    struct Balance has key {
        value: u64
    }

    public fun initialize(account: &signer, initial: u64) {
        move_to(account, Balance { value: initial });
    }

    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) acquires Balance {
        let from_addr = signer::address_of(from);
        let from_balance = borrow_global_mut<Balance>(from_addr);
        
        assert!(from_balance.value >= amount, E_INSUFFICIENT_BALANCE);
        from_balance.value = from_balance.value - amount;

        if (!exists<Balance>(to)) {
            move_to(from, Balance { value: amount });
        } else {
            let to_balance = borrow_global_mut<Balance>(to);
            to_balance.value = to_balance.value + amount;
        };
    }
}`;
  }

  private generateNFTContract(params: Record<string, string>): string {
    const moduleName = params.name || "MyNFT";
    const address = params.address || "0x1";

    return `module ${address}::${moduleName} {
    use std::signer;
    use std::string::String;
    use std::vector;

    struct NFTCollection has key {
        tokens: vector<NFT>,
        next_id: u64
    }

    struct NFT has store, drop {
        id: u64,
        name: String,
        uri: String,
        owner: address
    }

    public fun initialize(account: &signer) {
        move_to(account, NFTCollection {
            tokens: vector::empty<NFT>(),
            next_id: 0
        });
    }

    public entry fun mint_nft(
        account: &signer,
        name: String,
        uri: String
    ) acquires NFTCollection {
        let account_addr = signer::address_of(account);
        let collection = borrow_global_mut<NFTCollection>(account_addr);
        
        let new_nft = NFT {
            id: collection.next_id,
            name,
            uri,
            owner: account_addr
        };

        vector::push_back(&mut collection.tokens, new_nft);
        collection.next_id = collection.next_id + 1;
    }
}`;
  }

  private generateMarketplace(params: Record<string, string>): string {
    const moduleName = params.name || "Marketplace";
    const address = params.address || "0x1";

    return `module ${address}::${moduleName} {
    use std::signer;
    use std::vector;

    struct Listing has store, drop {
        id: u64,
        seller: address,
        price: u64,
        active: bool
    }

    struct MarketplaceData has key {
        listings: vector<Listing>,
        next_id: u64
    }

    public fun initialize(account: &signer) {
        move_to(account, MarketplaceData {
            listings: vector::empty<Listing>(),
            next_id: 0
        });
    }
}`;
  }

  explainConcept(concept: string): string {
    const conceptLower = concept.toLowerCase();

    const explanations: Record<string, string> = {
      "abilities": `Move Abilities:
- key: Can be stored in global storage
- store: Can be stored inside other structs
- copy: Can be copied
- drop: Can be dropped/destroyed

Example: struct MyResource has key, store { ... }`,

      "resources": `Move Resources:
- Structs with the 'key' ability
- Can be stored in global storage
- Cannot be copied or dropped (linear types)
- Accessed with move_to(), borrow_global(), exists()`,

      "acquires": `Acquires Keyword:
Functions that access global storage must declare which resources.

Example:
public fun transfer() acquires Balance {
    let balance = borrow_global_mut<Balance>(addr);
}`,
    };

    for (const [key, explanation] of Object.entries(explanations)) {
      if (conceptLower.includes(key)) {
        return explanation;
      }
    }

    return "Concept not found. Try: abilities, resources, acquires";
  }

  reviewCode(code: string): string[] {
    const issues: string[] = [];

    if (code.includes("borrow_global") && !code.includes("acquires")) {
      issues.push("⚠️  Missing 'acquires' declaration");
    }

    if (code.includes("move_to") && code.includes("struct") && !code.includes("has key")) {
      issues.push("⚠️  Resource needs 'key' ability");
    }

    if (!code.includes("const E_")) {
      issues.push("💡 Add error constants");
    }

    if (issues.length === 0) {
      return ["✅ Code looks good!"];
    }

    return issues;
  }
}

// Interactive CLI
async function main() {
  const moveAI = new MoveAI();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("╔════════════════════════════════════════╗");
  console.log("║   Move AI Assistant - TypeScript      ║");
  console.log("╚════════════════════════════════════════╝\n");

  const menu = `
Choose an option:
1. Generate Token Contract
2. Generate NFT Contract
3. Generate Marketplace
4. Explain Move Concept
5. Review Code
6. Exit

Enter choice (1-6): `;

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  let running = true;

  while (running) {
    const choice = await question(menu);

    switch (choice.trim()) {
      case '1': {
        const name = await question("Token name (e.g., GameToken): ");
        const address = await question("Address (e.g., 0xCAFE): ");
        console.log("\n" + "=".repeat(60));
        console.log(moveAI.generateCode("create a token", { 
          name: name || "MyToken", 
          address: address || "0x1" 
        }));
        console.log("=".repeat(60) + "\n");
        break;
      }

      case '2': {
        const name = await question("NFT name (e.g., CryptoArt): ");
        const address = await question("Address (e.g., 0xART): ");
        console.log("\n" + "=".repeat(60));
        console.log(moveAI.generateCode("create an nft", { 
          name: name || "MyNFT", 
          address: address || "0x1" 
        }));
        console.log("=".repeat(60) + "\n");
        break;
      }

      case '3': {
        const name = await question("Marketplace name: ");
        const address = await question("Address: ");
        console.log("\n" + "=".repeat(60));
        console.log(moveAI.generateCode("create a marketplace", { 
          name: name || "Marketplace", 
          address: address || "0x1" 
        }));
        console.log("=".repeat(60) + "\n");
        break;
      }

      case '4': {
        const concept = await question("Concept (abilities/resources/acquires): ");
        console.log("\n" + "=".repeat(60));
        console.log(moveAI.explainConcept(concept));
        console.log("=".repeat(60) + "\n");
        break;
      }

      case '5': {
        console.log("Paste your Move code (press Enter twice when done):");
        let code = '';
        let emptyLines = 0;
        
        while (emptyLines < 2) {
          const line = await question('');
          if (line === '') {
            emptyLines++;
          } else {
            emptyLines = 0;
            code += line + '\n';
          }
        }

        console.log("\n" + "=".repeat(60));
        const issues = moveAI.reviewCode(code);
        issues.forEach(issue => console.log(issue));
        console.log("=".repeat(60) + "\n");
        break;
      }

      case '6':
        console.log("\nGoodbye! 👋\n");
        running = false;
        break;

      default:
        console.log("Invalid choice. Please enter 1-6.\n");
    }
  }

  rl.close();
}

main().catch(console.error);
