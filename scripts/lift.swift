// Subject-lift masks with Apple Vision (macOS 14+). Used by scripts/cutout.mjs.
//   swift scripts/lift.swift <out-dir> <image>...
// Writes <out-dir>/<name>.png: a greyscale foreground mask (white = garment), same size as the input.
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments.dropFirst()
guard let outDir = args.first else { fatalError("usage: lift.swift <out-dir> <image>...") }
let ctx = CIContext()

for path in args.dropFirst() {
  let url = URL(fileURLWithPath: path)
  guard let src = CIImage(contentsOf: url) else { print("skip (unreadable): \(path)"); continue }
  let handler = VNImageRequestHandler(ciImage: src)
  let req = VNGenerateForegroundInstanceMaskRequest()
  do {
    try handler.perform([req])
    guard let obs = req.results?.first else { print("no subject: \(path)"); continue }
    let buf = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
    let mask = CIImage(cvPixelBuffer: buf)
    let out = URL(fileURLWithPath: outDir).appendingPathComponent(url.lastPathComponent)
    try ctx.writePNGRepresentation(of: mask, to: out, format: .L8, colorSpace: CGColorSpace(name: CGColorSpace.linearGray)!)
    print("ok \(url.lastPathComponent)")
  } catch {
    print("error \(path): \(error)")
  }
}
