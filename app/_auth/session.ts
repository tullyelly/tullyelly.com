import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import {
  buildCapabilities,
  type Capabilities,
  type CapabilityKey,
} from "./capabilities";

type FeatureSource = string[] | Set<string> | undefined | null;

type SessionUserWithFeatures = {
  features?: FeatureSource;
  capabilities?: FeatureSource;
};

function readFeatureSource(user: SessionUserWithFeatures | undefined | null) {
  if (user && user.features !== undefined && user.features !== null) {
    return user.features;
  }
  return user?.capabilities;
}

export async function getCapabilities(): Promise<Capabilities> {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUserWithFeatures | undefined;
  const source = readFeatureSource(user);
  return buildCapabilities(source ?? null);
}

export async function hasCapability(key: CapabilityKey): Promise<boolean> {
  const capabilities = await getCapabilities();
  return capabilities.has(key);
}
