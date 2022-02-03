import { BaseContract, CallOverrides, Signer } from "ethers";
import {  Provider } from "@ethersproject/providers";

/**
 * Partial duplication of the TypeChain generated file, to enable casting of contract that inherit from Version.
 * (This broken during the TypeChain 7.x & associated HardHat upgrades)
 * If the casting from a child to a parent TypeChain contract, this should be removed.
 */
export interface Version extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this
  attach(addressOrName: string): this
  deployed(): Promise<this>

  VERSION(overrides?: CallOverrides): Promise<string>

}
