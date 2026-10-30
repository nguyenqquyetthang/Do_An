import { sha256Hex } from "./sha256";

export interface DrawTerm {
  id: string;
  label: string;
  quantity: number;
}

export interface DrawnNumber {
  termId: string;
  termLabel: string;
  number: number;
}

/** Cam kết công bố trước khi mở bán: SHA-256(program | secret). */
export function buildCommitment(programId: string, secret: string): string {
  return sha256Hex(`luckydraw|program|${programId}|${secret}`);
}

/** Nguồn ngẫu nhiên công khai = SHA-256(commitment | publicSeed). */
export function buildRandomness(commitment: string, seed: string): string {
  return sha256Hex(`${commitment}|${seed}`);
}

/**
 * Rút số trúng từ nguồn ngẫu nhiên công khai. Tất định hoàn toàn: cùng commitment +
 * seed + cơ cấu giải sẽ luôn ra cùng kết quả, nên bất kỳ ai cũng tái kiểm chứng được.
 */
export function deriveWinners({
  commitment,
  seed,
  totalNumbers,
  terms,
}: {
  commitment: string;
  seed: string;
  totalNumbers: number;
  terms: DrawTerm[];
}): DrawnNumber[] {
  const winners: DrawnNumber[] = [];
  const used = new Set<number>();

  for (const term of terms) {
    for (let index = 0; index < term.quantity; index += 1) {
      let nonce = index;
      let number = 1;

      for (let attempt = 0; attempt < 128; attempt += 1) {
        const digest = sha256Hex(`${commitment}|${seed}|${term.id}|${nonce}`);
        number = (parseInt(digest.slice(0, 13), 16) % totalNumbers) + 1;
        if (!used.has(number)) break;
        nonce += 1;
      }

      used.add(number);
      winners.push({ termId: term.id, termLabel: term.label, number });
    }
  }

  return winners;
}

export function shortHash(hash: string, head = 10, tail = 6): string {
  if (!hash) return "—";
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}
