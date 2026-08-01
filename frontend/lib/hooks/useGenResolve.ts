"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { GenResolveContract } from "@/lib/contracts/genResolve";
import type { Claim } from "@/lib/contracts/types";
import { getErrorMessage } from "@/lib/utils";

export function useGenResolveContract(): GenResolveContract | null {
  const { network, contractAddress, address } = useWallet();

  return useMemo(() => {
    if (!contractAddress) return null;
    return new GenResolveContract(network, contractAddress, address);
  }, [network, contractAddress, address]);
}

export function useClaimCount() {
  const contract = useGenResolveContract();
  const { networkId, contractAddress } = useWallet();

  return useQuery({
    queryKey: ["claimCount", networkId, contractAddress],
    queryFn: async () => {
      if (!contract) return 0;
      return contract.getClaimCount();
    },
    enabled: !!contract,
    staleTime: 5_000,
  });
}

export function useOwner() {
  const contract = useGenResolveContract();
  const { networkId, contractAddress } = useWallet();

  return useQuery({
    queryKey: ["owner", networkId, contractAddress],
    queryFn: async () => {
      if (!contract) return "";
      return contract.getOwner();
    },
    enabled: !!contract,
    staleTime: 30_000,
  });
}

export function useClaims(offset = 0, limit = 20) {
  const contract = useGenResolveContract();
  const { networkId, contractAddress } = useWallet();

  return useQuery<Claim[], Error>({
    queryKey: ["claims", networkId, contractAddress, offset, limit],
    queryFn: async () => {
      if (!contract) return [];
      return contract.getClaims(offset, limit);
    },
    enabled: !!contract,
    staleTime: 5_000,
  });
}

export function useClaim(claimId: number | null) {
  const contract = useGenResolveContract();
  const { networkId, contractAddress } = useWallet();

  return useQuery<Claim, Error>({
    queryKey: ["claim", networkId, contractAddress, claimId],
    queryFn: async () => {
      if (!contract || claimId === null) {
        throw new Error("Contract or claim id missing");
      }
      return contract.getClaim(claimId);
    },
    enabled: !!contract && claimId !== null && !Number.isNaN(claimId),
    staleTime: 5_000,
  });
}

export function useCreateClaim() {
  const contract = useGenResolveContract();
  const queryClient = useQueryClient();
  const { networkId } = useWallet();

  return useMutation({
    mutationFn: async (input: {
      claimText: string;
      evidence: string;
      stakeWei: bigint;
    }) => {
      if (!contract) throw new Error("Contract not configured");
      return contract.createClaim(
        input.claimText,
        input.evidence,
        input.stakeWei
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["claims", networkId] });
      await queryClient.invalidateQueries({
        queryKey: ["claimCount", networkId],
      });
    },
    onError: (err) => {
      console.error("create_claim failed:", getErrorMessage(err));
    },
  });
}

export function useJudgeClaim() {
  const contract = useGenResolveContract();
  const queryClient = useQueryClient();
  const { networkId } = useWallet();

  return useMutation({
    mutationFn: async (claimId: number) => {
      if (!contract) throw new Error("Contract not configured");
      return contract.judgeClaim(claimId);
    },
    onSuccess: async (_data, claimId) => {
      await queryClient.invalidateQueries({ queryKey: ["claims", networkId] });
      await queryClient.invalidateQueries({
        queryKey: ["claim", networkId, undefined, claimId],
      });
      await queryClient.invalidateQueries({ queryKey: ["claim"] });
    },
    onError: (err) => {
      console.error("judge_claim failed:", getErrorMessage(err));
    },
  });
}
