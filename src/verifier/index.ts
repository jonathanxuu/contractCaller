import type { HexString } from "@zcloak/crypto/types";
import type { DidUrl } from "@zcloak/did-resolver/types";
import type { Proof } from "@zcloak/vc/types";
import type { VerifiableCredentialVersion } from "@zcloak/vc/types";
import {
    initCrypto,
} from "@zcloak/crypto";
import { verify_digest_signature } from "./didHandler";
import { eip712_sign } from "./signatureHandler";
import { Keyring } from "@zcloak/keyring";
import { randomAsU8a } from "@zcloak/crypto";
import { u8aToHex, hexToU8a } from "@polkadot/util"
import { fromMnemonic } from "@zcloak/did/keys";

// == phase 0: ZKP Generated (Generated in zkID Wallet, send to Server To Verify)  =====
// The following metadata should be passed from web to server


initCrypto().then(async () => {
    const result = await sbt_verifier('0x5f0d91707ce8e3e252f433b9d6c611fa8851c99c6f359f5b604cd0b8c8d355a7');
}
);

// ================================== Main Function ========================================
export async function sbt_verifier(
    program_hash: string
): Promise<[Uint8Array, string]> {

    let user_did: DidUrl = "did:zk:0x11f8b77F34FCF14B7095BF5228Ac0606324E82D1";
let ctype: HexString =
    "0x5f0d91707ce8e3e252f433b9d6c611fa8851c99c6f359f5b604cd0b8c8d355a7";
let vc_version: VerifiableCredentialVersion = "1";
let issuance_date: number = 1683918662477;
let expirationDate: number = 0;

let attester_did: DidUrl = "did:zk:0xFeDE01Ff4402e35c6f6d20De9821d64bDF4Ba563";
let attester_proof: Proof = {
    type: 'EcdsaSecp256k1SignatureEip191',
    created: 1684898119853,
    verificationMethod: 'did:zk:0xFeDE01Ff4402e35c6f6d20De9821d64bDF4Ba563#key-0',
    proofPurpose: 'assertionMethod',
    proofValue: 'zJ8tT2pHfFZWcKubt39Z7XCoxd7iG21Jz9Sos8eKbsirNdRW6of8GqRFgJNbmFwP8BuV53QMpjx1zggHc4qEaeP5fv'
  };
let zkp_result: string = `{
    "outputs": {
      "stack": [
        "13682078803786719864",     "17202764081818277337",     "17367760472180409902",     "18182358865673556573",     "1",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0",     "0" 
      ],
      "overflow_addrs": ["0", "2078", "2080", "2081", "2082", "2083"]
    }
}`;

let stack_input: string = "655660801";
    // ============= phase 1: ZKP send to the Rust Verifier ================================
    // The Rust Verifier should verify whether the ZKP is valid, and return the roothash and security_level(u32)

    let [roothash, is_valid]: [HexString, boolean] =
        verify_zk_program_in_server(program_hash, stack_input, zkp_result);

    if (!is_valid) {
        throw new Error("The ZKP Proof is invalid");
    }

    let current_time = new Date();
    let compare_time = current_time.setFullYear(current_time.getFullYear() - 18);

    if (
        (program_hash == "415a479f191532b76f464c2f0368acf528ff4d1c525c3bc88f63a6ecf3d71872" || program_hash == "3bfa5c8dd5c05a80b53218367d743dd9afc80ce947b96742328cec28a8228b38")
        &&
        Number(stack_input) >= new Date(compare_time).getTime() / 1000
    ) {
        throw new Error("The public input used in the program is invalid");
    }
    // ========== phase 2: Restore the digest and check the attester's signature ===========

    const digest: HexString = `0xd33faa6964e347b6b5ac5c79184d2c214132214bab6c0c425bd544d8109d09b3`;
    // caclculateDigest(
    //     roothash,
    //     user_did,
    //     issuanceDate,
    //     expirationDate,
    //     ctype,
    //     vc_version
    // );

    const signature_verify_result: boolean = await verify_digest_signature(
        attester_did,
        attester_proof,
        digest,
        vc_version
    );

    // ========== phase 3: Generate the SBT Picture and upload that on Arweave =============

    let sbt_link: string = upload_sbt_to_arweave(
        user_did,
        expirationDate,
        attester_did,
        program_hash,
        zkp_result
    );

    // ========== phase 4: Verifier should make a signature for the whole process(text) ====

    // should be replaced with the true verifier, here is a `demo` verifier
    let mnemonic =
        "cotton uncover trouble monster noble copper soft grace bulb peasant actual stuff";
    const testKeyring = new Keyring();

    const did = fromMnemonic(testKeyring, mnemonic);
    const controllerPath = `/m/44'/60'/0'/0/0`;
    const controller = testKeyring.addFromMnemonic(mnemonic, controllerPath, 'ecdsa');

    let verifier_signature: Uint8Array = eip712_sign(
        user_did,
        ctype,
        program_hash,
        digest,
        did.identifier,
        controller,
        attester_did,
        zkp_result,
        issuance_date,
        expirationDate,
        vc_version,
        sbt_link
    );
    return [verifier_signature, sbt_link];
}

// ================================= Helper ============================================
function verify_zk_program_in_server(
    program_hash: string,
    stack_input: string,
    zkp_result: string
): [HexString, boolean] {
    // ZKP Verifier inputs: program_hash, stack_inputs, zkp_result
    // ZKP Verifier outputs: roothash, is_valid
    let roothash: HexString =
        "0xb54286b662f32710a0bd9e97f887718aaf80d87cc528d5977a36e1b95b39f737";
    let is_valid = true;
    return [roothash, is_valid];
}

function upload_sbt_to_arweave(
    user_did: DidUrl,
    expirationDate: number,
    attester_did: DidUrl,
    program_hash: string,
    zkp_result: string
): string {
    // return the Arweave link of the SBT picture
    return "ipfs://QmNQXeiK4BtzVhNTA1GaHgoJNLBcksWw5yyUbEkBXHSLyQ/3.png";
}


