import type { AiProvider, ProviderDescriptor } from "./provider";

export class ProviderRegistry {
  private readonly providers = new Map<string, AiProvider>();
  private readonly descriptors = new Map<string, ProviderDescriptor>();

  register(provider: AiProvider): void {
    if (this.providers.has(provider.descriptor.id))
      throw new Error(`Provider already registered: ${provider.descriptor.id}`);
    this.providers.set(provider.descriptor.id, provider);
    this.descriptors.set(provider.descriptor.id, provider.descriptor);
  }

  declare(descriptor: ProviderDescriptor): void {
    if (!this.descriptors.has(descriptor.id)) this.descriptors.set(descriptor.id, descriptor);
  }

  get(id: string): AiProvider {
    const provider = this.providers.get(id);
    if (!provider) throw new Error(`Provider is not configured: ${id}`);
    return provider;
  }

  list(): readonly ProviderDescriptor[] {
    return [...this.descriptors.values()];
  }
  has(id: string): boolean {
    return this.providers.has(id);
  }
}
