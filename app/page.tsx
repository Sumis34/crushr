"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Image as ImageIcon, X, Check } from "lucide-react";

const resolutions = [
  { name: "4K", dimensions: "3840 x 2160", value: "4k", aspectRatio: "16/9" },
  {
    name: "1080p",
    dimensions: "1920 x 1080",
    value: "1080p",
    aspectRatio: "16/9",
  },
  {
    name: "720p",
    dimensions: "1280 x 720",
    value: "720p",
    aspectRatio: "16/9",
  },
  { name: "480p", dimensions: "854 x 480", value: "480p", aspectRatio: "16/9" },
];

const compressionRatios = [
  { value: "low", label: "High Compression (Low Quality)" },
  { value: "medium", label: "Balanced" },
  { value: "high", label: "Low Compression (High Quality)" },
];

const outputFormats = [
  { label: "JPEG", value: "image/jpeg", extension: "jpg" },
  { label: "PNG", value: "image/png", extension: "png" },
  { label: "WebP", value: "image/webp", extension: "webp" },
];

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  compressed: { [key: string]: string };
  compressionRatio: number;
}

export default function Component() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedResolutions, setSelectedResolutions] = useState(["1080p"]);
  const [selectedQualities, setSelectedQualities] = useState(["medium"]);
  const [selectedFormats, setSelectedFormats] = useState(["image/jpeg"]);
  const [showCompressed, setShowCompressed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      compressed: {},
      compressionRatio: 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const compressImages = async () => {
    if (!canvasRef.current) return;

    const compressedImages = await Promise.all(
      images.map(async (img) => {
        const compressed: { [key: string]: string } = {};
        let smallestSize = Infinity;

        for (const resolution of selectedResolutions) {
          for (const quality of selectedQualities) {
            for (const format of selectedFormats) {
              const compressedKey = `${resolution}-${quality}-${format}`;
              const compressedDataUrl = await compressImage(
                img.preview,
                resolution,
                quality,
                format
              );
              compressed[compressedKey] = compressedDataUrl;

              // Calculate size of compressed image
              const compressedSize = atob(
                compressedDataUrl.split(",")[1]
              ).length;
              if (compressedSize < smallestSize) {
                smallestSize = compressedSize;
              }
            }
          }
        }

        // Calculate compression ratio
        const originalSize = img.file.size;
        const compressionRatio =
          ((originalSize - smallestSize) / originalSize) * 100;

        return { ...img, compressed, compressionRatio };
      })
    );

    setImages(compressedImages);
    setShowCompressed(true);
  };

  const compressImage = (
    src: string,
    resolution: string,
    quality: string,
    format: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        let width, height;
        switch (resolution) {
          case "4k":
            width = 3840;
            height = 2160;
            break;
          case "1080p":
            width = 1920;
            height = 1080;
            break;
          case "720p":
            width = 1280;
            height = 720;
            break;
          case "480p":
            width = 854;
            height = 480;
            break;
          default:
            width = img.width;
            height = img.height;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        let compressionQuality = 0.5;
        if (quality === "low") compressionQuality = 0.3;
        if (quality === "high") compressionQuality = 0.7;

        resolve(canvas.toDataURL(format, compressionQuality));
      };
      img.src = src;
    });
  };

  const downloadImages = () => {
    images.forEach((img, index) => {
      Object.entries(img.compressed).forEach(([key, dataUrl]) => {
        const [resolution, quality, format] = key.split("-");
        const extension =
          outputFormats.find((f) => f.value === format)?.extension || "jpg";
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `compressed-image-${
          index + 1
        }-${resolution}-${quality}.${extension}`;
        link.click();
      });
    });
  };

  const toggleSelection = (
    value: string,
    currentSelection: string[],
    setSelection: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelection((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Image Compressor</h1>
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-compressed">Show compressed</Label>
            <Switch
              id="show-compressed"
              checked={showCompressed}
              onCheckedChange={setShowCompressed}
            />
          </div>
        </div>
        <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-y-auto">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  {showCompressed && Object.keys(img.compressed).length > 0 ? (
                    <img
                      src={Object.values(img.compressed)[0]}
                      alt="Compressed"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={img.preview}
                      alt="Original"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  {img.compressionRatio > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                      <div className="text-xs mb-1">
                        Compression: {img.compressionRatio.toFixed(2)}%
                      </div>
                      <Progress value={img.compressionRatio} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-1 text-sm text-gray-600">
                  Upload images to start
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            multiple
          />
          <label htmlFor="image-upload">
            <Button asChild className="w-full">
              <span>
                <Upload className="mr-2 h-4 w-4" /> Upload Images
              </span>
            </Button>
          </label>
        </div>
      </div>
      <div className="w-96 bg-white p-6 shadow-lg flex flex-col overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Compression Options</h2>
        <div className="mb-6">
          <Label className="text-base mb-2 block">Resolutions</Label>
          <div className="grid grid-cols-2 gap-4">
            {resolutions.map(({ name, dimensions, value, aspectRatio }) => (
              <button
                key={value}
                onClick={() =>
                  toggleSelection(
                    value,
                    selectedResolutions,
                    setSelectedResolutions
                  )
                }
                className={`relative overflow-hidden rounded-lg border-2 transition-colors ${
                  selectedResolutions.includes(value)
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="aspect-[16/9] w-full bg-gray-100 flex items-center justify-center">
                  <div
                    className="bg-gray-300"
                    style={{
                      width: "80%",
                      height: "80%",
                      aspectRatio: aspectRatio,
                    }}
                  ></div>
                </div>
                <div className="p-2 text-center">
                  <span className="font-medium">{name}</span>
                  <span className="text-xs text-gray-500 block">
                    {dimensions}
                  </span>
                </div>
                {selectedResolutions.includes(value) && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <Label className="text-base mb-2 block">Compression Ratios</Label>
          <div className="flex flex-wrap gap-2">
            {compressionRatios.map(({ value, label }) => (
              <button
                key={value}
                onClick={() =>
                  toggleSelection(
                    value,
                    selectedQualities,
                    setSelectedQualities
                  )
                }
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedQualities.includes(value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <Label className="text-base mb-2 block">Output Formats</Label>
          <div className="flex flex-wrap gap-2">
            {outputFormats.map(({ label, value }) => (
              <button
                key={value}
                onClick={() =>
                  toggleSelection(value, selectedFormats, setSelectedFormats)
                }
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFormats.includes(value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={compressImages}
          className="mb-2"
          disabled={
            images.length === 0 ||
            selectedResolutions.length === 0 ||
            selectedQualities.length === 0 ||
            selectedFormats.length === 0
          }
        >
          Compress Images
        </Button>
        <Button
          variant="outline"
          onClick={downloadImages}
          disabled={
            !images.some((img) => Object.keys(img.compressed).length > 0)
          }
        >
          <Download className="mr-2 h-4 w-4" /> Download Compressed Images
        </Button>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
