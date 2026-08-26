package com.divibisoul.soul

/** Complete logical 5-IN/5-OUT channel matrix for the six-nucleus Soul Mesh. */
object SoulMeshChannels {
    val nuclei = listOf("N01", "N02", "N03", "N04", "N05", "N06")

    /** Five outbound peers for each nucleus. */
    fun out(source: String): List<String> = nuclei.filter { it != source }

    /** Five inbound peers for each nucleus. */
    fun input(target: String): List<String> = nuclei.filter { it != target }

    /** All 30 directed logical links. */
    fun directedLinks(): List<Pair<String, String>> = nuclei.flatMap { source ->
        out(source).map { target -> source to target }
    }

    /** All 15 bidirectional peer pairs. */
    fun bidirectionalPairs(): List<Set<String>> = nuclei.flatMapIndexed { i, source ->
        nuclei.drop(i + 1).map { target -> setOf(source, target) }
    }

    init {
        require(nuclei.size == 6)
        require(nuclei.all { out(it).size == 5 && input(it).size == 5 })
        require(directedLinks().size == 30)
        require(bidirectionalPairs().size == 15)
    }
}
