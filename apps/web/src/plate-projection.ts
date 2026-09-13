/** Plate corners use a normalized 1152 × 768 stage, including portrait images. */
export function plateProjection(image: {w:number;h:number}, frame: {width:number;height:number}, position: readonly [number,number] = [.5,.5]) {
  const cover = Math.max(frame.width / image.w, frame.height / image.h);
  const width = image.w * cover, height = image.h * cover;
  return { scaleX: width / 1152, scaleY: height / 768, offsetX: (frame.width - width) * position[0], offsetY: (frame.height - height) * position[1] };
}
