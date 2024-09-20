"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Download, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";

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
  const [selectedQualities] = useState(["medium"]);
  const [selectedFormats, setSelectedFormats] = useState(["image/jpeg"]);
  const [compressionQuality, setCompressionQuality] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setTheme, theme } = useTheme();

  const getCompressionTip = (quality: number) => {
    if (quality < 25) {
      return "High compression, significant quality loss. Best for very small file sizes, but not recommended for most uses.";
    } else if (quality < 50) {
      return "Medium-high compression. Good for web graphics where some quality loss is acceptable.";
    } else if (quality < 75) {
      return "Balanced compression. Good for most web uses, offering a good balance between file size and quality.";
    } else {
      return "Low compression, high quality. Best for images where detail is important, but results in larger file sizes.";
    }
  };

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
    <div className="flex h-screen">
      <div className="w-96 bg-background p-6 shadow-lg flex flex-col overflow-y-auto border">
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
                    ? "border-primary"
                    : "border-border"
                }`}
              >
                <div className="aspect-[16/9] w-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center">
                  <div
                    className="bg-gray-300 dark:bg-neutral-600 w-[70%] h-[70%] rounded-[5px]"
                    style={{
                      aspectRatio: aspectRatio,
                    }}
                  ></div>
                </div>
                <div className="p-2 text-center">
                  <span className="font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground block">
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
          <div>
            <div className="flex gap-4">
              <Input
                onChange={(e) => setCompressionQuality(e.target.valueAsNumber)}
                className="w-14 h-8"
                type="number"
                value={compressionQuality}
              />
              <Slider
                value={[compressionQuality]}
                onValueChange={(value) => setCompressionQuality(value[0])}
                max={100}
                step={1}
                className="mb-2"
              />
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {getCompressionTip(compressionQuality)}
            </div>
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
        <Button
          variant="outline"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          Theme
        </Button>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
      <div className="flex-1 p-6 flex flex-col bg-background">
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
    </div>
  );
}
