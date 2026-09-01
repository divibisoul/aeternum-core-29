package com.divibisoul.soul

/** Complete logical 6-IN/6-OUT channel matrix for the seven-nucleus Soul Mesh. */
object SoulMeshChannels {
    val nuclei = listOf("N01", "N02", "N03", "N04", "N05", "N06", "N07")
    fun out(source: String): List<String> = nuclei.filter { it != source }
    fun input(target: String): List<String> = nuclei.filter { it != target }
    /** All 42 directed logical links in the current seven-nucleus topology. */
    fun directedLinks(): List<Pair<String, String>> = nuclei.flatMap { source -> out(source).map { target -> source to target } }
    /** All 21 bidirectional peer pairs. */
    fun bidirectionalPairs(): List<Set<String>> = nuclei.flatMapIndexed { i, source -> nuclei.drop(i + 1).map { target -> setOf(source, target) } }
    init {
        require(nuclei.size == 7)
        require(nuclei.all { out(it).size == 6 && input(it).size == 6 })
        require(directedLinks().size == 42)
        require(bidirectionalPairs().size == 21)
    }
}
