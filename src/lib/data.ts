import type { FileNode } from "@/types/ide"

export const STORAGE_KEY = "cairo-ide-state"


export const initialFiles: FileNode[] = [
  {
    id: "1",
    name: "src",
    type: "folder",
    path: "/src",
    children: [
      {
        id: "2",
        name: "lib.cairo",
        type: "file",
        path: "/src/lib.cairo",
        content: `// Welcome to Cairo IDE
// This is a sample Cairo smart contract

#[starknet::interface]
trait ICounter<TContractState> {
    fn get_counter(self: @TContractState) -> u32;
    fn increase_counter(ref self: TContractState);
}

#[starknet::contract]
mod Counter {
    #[storage]
    struct Storage {
        counter: u32,
    }

    #[abi(embed_v0)]
    impl Counter of super::ICounter<ContractState> {
        fn get_counter(self: @ContractState) -> u32 {
            self.counter.read()
        }

        fn increase_counter(ref self: ContractState) {
            self.counter.write(self.counter.read() + 1);
        }
    }
}
`,
      },
    ],
  },
  {
    id: "3",
    name: "Scarb.toml",
    type: "file",
    path: "/Scarb.toml",
    content: `[package]
name = "cairo_project"
version = "0.1.0"

[dependencies]
starknet = ">=2.3.0"

[[target.starknet-contract]]
`,
  },
];