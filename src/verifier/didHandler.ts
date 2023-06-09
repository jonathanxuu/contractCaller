
import type { HexString } from '@zcloak/crypto/types';
import type { DidUrl } from '@zcloak/did-resolver/types';
import { Proof, VerifiableCredentialVersion } from '@zcloak/vc/types';
import { helpers, Did } from '@zcloak/did';
import { proofVerify } from '@zcloak/verify/proofVerify';
import { signedVCMessage } from '@zcloak/vc/utils';
import { decodeMultibase } from '@zcloak/crypto';
import { u8aToHex } from '@polkadot/util'
export async function verify_digest_signature(
    attester_did: DidUrl,
    proof: Proof,
    digest: HexString,
    vc_version: VerifiableCredentialVersion,
): Promise<boolean> {
    const attester: Did = await helpers.fromDid(attester_did);
    const message = signedVCMessage(digest, vc_version) ;
    const proofValid = await proofVerify(message, proof, attester.getDocument());

    return proofValid;
}

