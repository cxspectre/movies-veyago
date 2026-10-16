// ocr.swift <image>... : prints the text macOS Vision reads in each image (one line per image),
// used to scan captures for words the film must not show.
import Foundation
import Vision

for path in CommandLine.arguments.dropFirst() {
    guard let url = URL(string: "file://" + path) else { continue }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    let handler = VNImageRequestHandler(url: url)
    do {
        try handler.perform([request])
        let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
        print("\((path as NSString).lastPathComponent)\t\(lines.joined(separator: " | "))")
    } catch {
        FileHandle.standardError.write("OCR failed for \(path): \(error)\n".data(using: .utf8)!)
    }
}
