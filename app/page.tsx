"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart2, ImageIcon, Upload, Zap } from "lucide-react";
import { useState } from "react";
import imageCompression, { Options } from "browser-image-compression";

const options: Options = {
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp",
};

export default function Home() {
  const [selectedCompression, setSelectedCompression] = useState("balanced");
  const [selectedResolution, setSelectedResolution] = useState("original");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [compressionRate, setCompressionRate] = useState<number | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCompression = async () => {
    // Simulating compression rate calculation

    if (!file) return;

    const compressedFile = await imageCompression(file, options);

    // Download image
    const downloadUrl = URL.createObjectURL(compressedFile);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "compressed-image.webp";
    a.click();

    const rate = Math.floor(Math.random() * 50) + 30; // Random number between 30-80%
    setCompressionRate(rate);
  };
  return (
    <div className="flex justify-center">
      <div className="container max-w-screen-lg space-y-5">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <h1 className="text-3xl font-bold text-center">
            Image Compression Tool
          </h1>

          {/* Image Upload Area */}
          <Card className="p-6">
            <div className="flex items-center justify-center w-full">
              <Label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or GIF (MAX. 800x400px)
                    </p>
                  </div>
                )}
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </Label>
            </div>
          </Card>

          {/* Compression Options */}
          <RadioGroup
            value={selectedCompression}
            onValueChange={setSelectedCompression}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              {
                value: "high",
                label: "High Compression",
                icon: Zap,
                description: "Smallest file size, lower quality",
              },
              {
                value: "balanced",
                label: "Balanced",
                icon: BarChart2,
                description: "Good balance of size and quality",
              },
              {
                value: "low",
                label: "Low Compression",
                icon: ImageIcon,
                description: "Larger file size, best quality",
              },
            ].map((option) => (
              <Card
                key={option.value}
                className={`p-4 cursor-pointer transition-all ${
                  selectedCompression === option.value
                    ? "ring-2 ring-primary"
                    : ""
                }`}
              >
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className="flex flex-col items-center space-y-2 cursor-pointer"
                >
                  <option.icon className="w-8 h-8" />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm text-gray-500 text-center">
                    {option.description}
                  </span>
                </Label>
              </Card>
            ))}
          </RadioGroup>

          {/* Output Resolution */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Output Resolution</h3>
            <div className="flex flex-wrap gap-2">
              {["original", "1920x1080", "1280x720", "800x600"].map(
                (resolution) => (
                  <Button
                    key={resolution}
                    variant={
                      selectedResolution === resolution ? "default" : "outline"
                    }
                    onClick={() => setSelectedResolution(resolution)}
                    className="rounded-full"
                  >
                    {resolution}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Compression Rate Display */}
          {compressionRate !== null && (
            <Card className="p-4 bg-green-50">
              <p className="text-center text-green-700">
                Compression Rate:{" "}
                <span className="font-bold">{compressionRate}%</span>
              </p>
            </Card>
          )}

          {/* Submit Button */}
          <Button onClick={handleCompression} className="w-full" size="lg">
            Compress Image
          </Button>
        </div>
      </div>
    </div>
  );
}
