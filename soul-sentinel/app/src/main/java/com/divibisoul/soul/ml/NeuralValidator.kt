package com.divibisoul.soul.ml

import android.content.Context
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.nnapi.NnApiDelegate
import java.nio.MappedByteBuffer
import java.io.FileInputStream
import java.nio.channels.FileChannel

data class NeuralValidationResult(
    val status: String,
    val anomalyScore: Float?
)

class NeuralValidator(private val context: Context) {
    private var interpreter: Interpreter? = null
    private var delegate: NnApiDelegate? = null

    fun initialize(): Boolean {
        return runCatching {
            val file = context.assets.openFd("neural_validator.tflite")
            val input: MappedByteBuffer = FileInputStream(file.fileDescriptor).channel.map(
                FileChannel.MapMode.READ_ONLY,
                file.startOffset,
                file.declaredLength
            )
            delegate = runCatching { NnApiDelegate() }.getOrNull()
            val options = Interpreter.Options()
            delegate?.let(options::addDelegate)
            interpreter = Interpreter(input, options)
            true
        }.getOrDefault(false)
    }

    fun validate(features: FloatArray): NeuralValidationResult {
        val model = interpreter ?: return NeuralValidationResult("UNAVAILABLE_MODEL", null)
        return runCatching {
            val output = Array(1) { FloatArray(1) }
            model.run(arrayOf(features), output)
            NeuralValidationResult("VALIDATED", output[0][0])
        }.getOrElse {
            NeuralValidationResult("INFERENCE_ERROR", null)
        }
    }

    fun close() {
        interpreter?.close()
        interpreter = null
        delegate?.close()
        delegate = null
    }
}
