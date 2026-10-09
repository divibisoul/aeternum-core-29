package com.divibisoul.soul

/**
 * Logical channels for the six operational AI nuclei.
 *
 * N07 remains a recognized structural/control-plane participant in SoulMeshContract,
 * but it is not counted as a seventh AI nucleus or as part of the 60 active AI surfaces.
 * It can be promoted into the operational matrix only through an explicit commissioning change.
 */
object SoulMeshChannels {
    val nuclei = listOf("N01", "N02", "N03", "N04", "N05", "N06")
    val structuralNuclei = listOf("N07")
    val participants = nuclei + structuralNuclei

    fun out(source: String): List<String> {
        require(source in nuclei) { "Unknown operational AI nucleus: $source" }
        return nuclei.filter { it != source }
    }

    fun input(target: String): List<String> {
        require(target in nuclei) { "Unknown operational AI nucleus: $target" }
        return nuclei.filter { it != target }
    }

    /** The 30 unique directed requests among N01..N06. */
    fun directedLinks(): List<Pair<String, String>> =
        nuclei.flatMap { source -> out(source).map { target -> source to target } }

    /** The 15 unordered peer pairs among N01..N06. */
    fun bidirectionalPairs(): List<Set<String>> =
        nuclei.flatMapIndexed { index, source ->
            nuclei.drop(index + 1).map { target -> setOf(source, target) }
        }

    /**
     * Returns the 60 directional endpoint surfaces: one OUT surface on the sender and
     * one IN surface on the receiver for each of the 30 directed requests.
     * Slot numbers are local to the owning nucleus and refer to the peer's stable list position.
     */
    fun channelIds(): List<String> =
        nuclei.flatMap { source ->
            out(source).mapIndexed { outIndex, target ->
                val inputSlot = input(target).indexOf(source) + 1
                listOf(
                    "$source.OUT.${outIndex + 1}.$target",
                    "$target.IN.$inputSlot.$source",
                )
            }
        }.flatten()

    init {
        require(nuclei.size == 6)
        require(structuralNuclei == listOf("N07"))
        require(participants.size == 7 && participants.toSet().size == 7)
        require(nuclei.all { out(it).size == 5 && input(it).size == 5 })
        require(directedLinks().size == 30)
        require(bidirectionalPairs().size == 15)
        require(channelIds().size == 60)
        require(channelIds().toSet().size == 60)
    }
}
