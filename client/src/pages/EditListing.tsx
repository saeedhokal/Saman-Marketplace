import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/hooks/use-auth";
import { insertProductSchema, type Product } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Loader2, UploadCloud, Car, Wrench, ArrowLeft, X, Plus } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { apiRequest, queryClient } from "@/lib/queryClient";

const formSchema = insertProductSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().min(1, "At least one photo is required"),
  imageUrls: z.array(z.string()).optional(),
  mainCategory: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  mileage: z.coerce.number().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  price: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditListing() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/edit/:id");
  const listingId = params?.id ? Number(params.id) : null;
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useUpload();

  const { data: listing, isLoading: isListingLoading } = useQuery<Product>({
    queryKey: ["/api/products", listingId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${listingId}`);
      if (!res.ok) throw new Error("Failed to fetch listing");
      return res.json();
    },
    enabled: !!listingId && !!user,
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      mainCategory: "",
      subCategory: "",
      imageUrl: "",
      imageUrls: [],
      mileage: undefined,
      year: undefined,
      price: undefined,
    },
  });

  useEffect(() => {
    if (listing && !initialized) {
      form.reset({
        title: listing.title,
        description: listing.description || "",
        mainCategory: listing.mainCategory,
        subCategory: listing.subCategory,
        imageUrl: listing.imageUrl || "",
        imageUrls: listing.imageUrls || [],
        mileage: listing.mileage || undefined,
        year: listing.year || undefined,
        price: listing.price ? listing.price / 100 : undefined,
      });
      const images = listing.imageUrls?.length ? listing.imageUrls : (listing.imageUrl ? [listing.imageUrl] : []);
      setUploadedImages(images);
      setInitialized(true);
    }
  }, [listing, form, initialized]);

  const mainCategory = form.watch("mainCategory");
  const subCategory = form.watch("subCategory");
  const isAutomotive = mainCategory === "Automotive";

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isAuthLoading, setLocation]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        ...data,
        price: data.price ? Math.round(data.price * 100) : undefined,
      };
      await apiRequest("PUT", `/api/products/${listingId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", listingId] });
      toast({ title: "Listing Updated!" });
      setLocation("/my-listings");
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update listing",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 20 - uploadedImages.length;
    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Maximum photos reached",
        description: "You can upload up to 20 photos.",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      try {
        const result = await uploadFile(file);
        if (result) {
          setUploadedImages((prev) => {
            const newImages = [...prev, result.objectPath];
            form.setValue("imageUrl", newImages[0], { shouldValidate: true });
            form.setValue("imageUrls", newImages);
            return newImages;
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: `Failed to upload ${file.name}. Please try again.`,
        });
      }
    }

    toast({
      title: "Photos uploaded",
      description: `${filesToUpload.length} photo(s) uploaded successfully.`,
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length > 0) {
        form.setValue("imageUrl", newImages[0], { shouldValidate: true });
        form.setValue("imageUrls", newImages);
      } else {
        form.setValue("imageUrl", "", { shouldValidate: true });
        form.setValue("imageUrls", []);
      }
      return newImages;
    });
  };

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  if (isAuthLoading || isListingLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Listing not found</p>
        <Link href="/my-listings">
          <Button variant="outline" className="mt-4">Go Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/my-listings">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Edit Listing</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 max-w-2xl">
        <div className="bg-card border border-border shadow-lg rounded-xl p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Category
                </h3>
                
                <CategoryCombobox
                  mainCategory={mainCategory}
                  subCategory={subCategory}
                  onMainCategoryChange={(value) => {
                    form.setValue("mainCategory", value, { shouldValidate: true });
                    form.setValue("mileage", undefined);
                    form.setValue("year", undefined);
                  }}
                  onSubCategoryChange={(value) => form.setValue("subCategory", value, { shouldValidate: true })}
                />
                
                {form.formState.errors.mainCategory && (
                  <p className="text-sm text-destructive">{form.formState.errors.mainCategory.message}</p>
                )}
                {form.formState.errors.subCategory && (
                  <p className="text-sm text-destructive">{form.formState.errors.subCategory.message}</p>
                )}
              </div>

              {mainCategory && (
                <>
                  <div className="h-px bg-border" />
                  
                  <div className="flex items-center gap-2 text-sm">
                    {isAutomotive ? (
                      <Car className="h-4 w-4 text-accent" />
                    ) : (
                      <Wrench className="h-4 w-4 text-accent" />
                    )}
                    <span className="font-medium">
                      {isAutomotive ? "Vehicle Details" : "Part Details"}
                    </span>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={isAutomotive ? "e.g. 2020 Toyota Camry SE" : "e.g. Toyota Camry Bumper OEM"} 
                            className="h-12" 
                            data-testid="input-title"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photos ({uploadedImages.length}/20)</FormLabel>
                        <FormControl>
                          <div>
                            <Input type="hidden" {...field} />
                            
                            {uploadedImages.length > 0 ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  {uploadedImages.map((img, index) => (
                                    <div 
                                      key={index} 
                                      className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                                    >
                                      <img 
                                        src={img} 
                                        alt={`Preview ${index + 1}`} 
                                        className="w-full h-full object-cover"
                                      />
                                      {index === 0 && (
                                        <div className="absolute top-1 left-1 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded">
                                          Main
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                                        data-testid={`button-remove-image-${index}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                  
                                  {uploadedImages.length < 20 && (
                                    <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-accent/50 hover:bg-secondary/20 transition-colors relative">
                                      <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        multiple
                                        disabled={isUploading}
                                      />
                                      {isUploading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                      ) : (
                                        <Plus className="h-6 w-6 text-muted-foreground" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 transition-colors hover:border-accent/50 hover:bg-secondary/20">
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                                  {isUploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  ) : (
                                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="relative overflow-hidden"
                                  disabled={isUploading}
                                  data-testid="button-upload-image"
                                >
                                  <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    multiple
                                  />
                                  {isUploading ? "Uploading..." : "Upload Photos"}
                                </Button>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  JPG, PNG up to 5MB each (max 20 photos)
                                </p>
                              </div>
                            )}
                            
                            {isUploading && (
                              <div className="mt-2 h-1 w-full bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-accent transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isAutomotive && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g. 2020" 
                                className="h-12" 
                                data-testid="input-year"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mileage (km)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g. 50000" 
                                className="h-12" 
                                data-testid="input-mileage"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={isAutomotive 
                              ? "Describe the vehicle condition, features, service history..." 
                              : "Describe the part condition, compatibility, any defects..."
                            }
                            className="min-h-[120px] resize-none leading-relaxed" 
                            data-testid="input-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-14 text-lg bg-accent hover:bg-accent/90"
                      disabled={updateMutation.isPending || isUploading || !initialized}
                      data-testid="button-save"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                        </>
                      ) : !initialized ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      Updated listings will be sent for re-approval
                    </p>
                  </div>
                </>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
