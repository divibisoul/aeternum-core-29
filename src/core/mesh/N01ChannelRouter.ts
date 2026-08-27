/**
 * @deprecated Use `N01MeshChannelFabric` for channel routing and `SoulMeshRouter`
 * as the single canonical message router. Kept as a compatibility export so
 * existing imports do not break while the architecture is consolidated.
 */
export { N01MeshChannelFabric as N01ChannelRouter } from './N01MeshChannelFabric';
export type { N01InboundChannelHandler, N01OutboundChannelFactory } from './N01MeshChannelFabric';
