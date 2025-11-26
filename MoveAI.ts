// MoveAI.ts - Complete TypeScript implementation
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
      },
      {
        pattern: "create_struct",
        template: `struct {{struct_name}} has key, store {
    {{fields}}
}`,
        description: "Creates a Move struct with abilities"
      }
    ];
  }

  analyzeCode(code: string): void {
    const moduleRegex = /module\s+(\w+::\w+)/g;
    let match;
    while ((match = moduleRegex.exec(code)) !== null) {
      if (!this.context.modules.includes(match[1])) {
        this.context.modules.push(match[1]);
      }
    }

    const structRegex = /struct\s+(\w+)/g;
    while ((match = structRegex.exec(code)) !== null) {
      if (!this.context.structs.includes(match[1])) {
        this.context.structs.push(match[1]);
      }
    }

    const funcRegex = /(?:public\s+)?fun\s+(\w+)/g;
    while ((match = funcRegex.exec(code)) !== null) {
      if (!this.context.functions.includes(match[1])) {
        this.context.functions.push(match[1]);
      }
    }
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
        let account_addr = signer::address_of(account);
        move_to(account, Data { value: 0 });
    }

    public fun update_value(account: &signer, new_value: u64) acquires Data {
        let account_addr = signer::address_of(account);
        let data = borrow_global_mut<Data>(account_addr);
        data.value = new_value;
    }

    public fun get_value(account_addr: address): u64 acquires Data {
        borrow_global<Data>(account_addr).value
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
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;

    struct TokenInfo has key {
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64
    }

    struct Balance has key {
        value: u64
    }

    public fun initialize(
        account: &signer,
        name: String,
        symbol: String,
        decimals: u8,
        initial_supply: u64
    ) {
        let account_addr = signer::address_of(account);
        assert!(!exists<TokenInfo>(account_addr), E_ALREADY_INITIALIZED);

        move_to(account, TokenInfo {
            name,
            symbol,
            decimals,
            total_supply: initial_supply
        });

        move_to(account, Balance {
            value: initial_supply
        });
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
            move_to(from, Balance { value: 0 });
        };

        let to_balance = borrow_global_mut<Balance>(to);
        to_balance.value = to_balance.value + amount;
    }

    public fun balance_of(account: address): u64 acquires Balance {
        assert!(exists<Balance>(account), E_NOT_INITIALIZED);
        borrow_global<Balance>(account).value
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

    const E_NOT_OWNER: u64 = 1;
    const E_TOKEN_NOT_FOUND: u64 = 2;

    struct NFTCollection has key {
        tokens: vector<NFT>,
        next_id: u64
    }

    struct NFT has store, drop {
        id: u64,
        name: String,
        description: String,
        uri: String,
        owner: address
    }

    public fun initialize_collection(account: &signer) {
        let account_addr = signer::address_of(account);
        
        move_to(account, NFTCollection {
            tokens: vector::empty<NFT>(),
            next_id: 0
        });
    }

    public entry fun mint_nft(
        account: &signer,
        name: String,
        description: String,
        uri: String
    ) acquires NFTCollection {
        let account_addr = signer::address_of(account);
        let collection = borrow_global_mut<NFTCollection>(account_addr);
        
        let new_nft = NFT {
            id: collection.next_id,
            name,
            description,
            uri,
            owner: account_addr
        };

        vector::push_back(&mut collection.tokens, new_nft);
        collection.next_id = collection.next_id + 1;
    }

    public fun get_nft_count(account: address): u64 acquires NFTCollection {
        let collection = borrow_global<NFTCollection>(account);
        vector::length(&collection.tokens)
    }
}`;
  }

  private generateMarketplace(params: Record<string, string>): string {
    const moduleName = params.name || "Marketplace";
    const address = params.address || "0x1";

    return `module ${address}::${moduleName} {
    use std::signer;
    use std::vector;

    const E_LISTING_NOT_FOUND: u64 = 1;
    const E_INSUFFICIENT_PAYMENT: u64 = 2;
    const E_NOT_SELLER: u64 = 3;

    struct Listing has store, drop {
        id: u64,
        seller: address,
        price: u64,
        item_id: u64,
        active: bool
    }

    struct MarketplaceData has key {
        listings: vector<Listing>,
        next_listing_id: u64
    }

    public fun initialize(account: &signer) {
        move_to(account, MarketplaceData {
            listings: vector::empty<Listing>(),
            next_listing_id: 0
        });
    }

    public entry fun create_listing(
        seller: &signer,
        item_id: u64,
        price: u64
    ) acquires MarketplaceData {
        let seller_addr = signer::address_of(seller);
        let marketplace = borrow_global_mut<MarketplaceData>(@${address});
        
        let listing = Listing {
            id: marketplace.next_listing_id,
            seller: seller_addr,
            price,
            item_id,
            active: true
        };

        vector::push_back(&mut marketplace.listings, listing);
        marketplace.next_listing_id = marketplace.next_listing_id + 1;
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
Functions that access global storage must declare which resources they acquire.

Example:
public fun transfer() acquires Balance {
    let balance = borrow_global_mut<Balance>(addr);
}`,

      "signer": `Signer Type:
- Represents transaction sender authority
- Cannot be copied or stored
- Used to prove ownership/authorization
- Common pattern: signer::address_of(&signer)`,
    };

    for (const [key, explanation] of Object.entries(explanations)) {
      if (conceptLower.includes(key)) {
        return explanation;
      }
    }

    return "Concept not found. Available: abilities, resources, acquires, signer";
  }

  reviewCode(code: string): string[] {
    const issues: string[] = [];

    if (code.includes("borrow_global") && !code.includes("acquires")) {
      issues.push("⚠️  Functions using borrow_global must declare 'acquires'");
    }

    if (code.includes("move_to") && code.includes("struct")) {
      if (!code.includes("has key")) {
        issues.push("⚠️  Resources moved to storage need 'key' ability");
      }
    }

    if (!code.includes("const E_")) {
      issues.push("💡 Consider defining error constants");
    }

    if (issues.length === 0) {
      return ["✅ No obvious issues found!"];
    }

    return issues;
  }

  getContext(): MoveContext {
    return this.context;
  }
}

// Example usage
const moveAI = new MoveAI();

console.log("=== Generating Token Contract ===");
const tokenCode = moveAI.generateCode("create a token", {
  name: "GameToken",
  address: "0xCAFE"
});
console.log(tokenCode);

console.log("\n=== Explaining Concept ===");
console.log(moveAI.explainConcept("abilities"));

console.log("\n=== Code Review ===");
const sampleCode = `
public fun transfer(amount: u64) {
    let balance = borrow_global_mut<Balance>(addr);
}
`;
const review = moveAI.reviewCode(sampleCode);
review.forEach(issue => console.log(issue));