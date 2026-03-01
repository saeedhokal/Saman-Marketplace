import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCreateProduct } from "@/hooks/use-products";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/hooks/use-auth";
import { insertProductSchema, CAR_MODELS } from "@shared/schema";
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
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, UploadCloud, AlertCircle, Coins, Clock, Car, Wrench, ArrowLeft, X, Plus } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { useLanguage } from "@/hooks/use-language";

const formSchema = insertProductSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().min(1, "At least one photo is required"),
  imageUrls: z.array(z.string()).optional(),
  mainCategory: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  model: z.string().optional(),
  mileage: z.coerce.number().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  price: z.coerce.number().min(45, "Price must be at least 45 AED"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Sell() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProduct = useCreateProduct();
  const { uploadFile, isUploading, progress } = useUpload();
  const { t, isRTL } = useLanguage();

  const { data: userInfo } = useQuery<{ 
    sparePartsCredits: number; 
    automotiveCredits: number; 
    isAdmin: boolean;
    subscriptionEnabled: boolean;
  }>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      mainCategory: "",
      subCategory: "",
      model: "",
      imageUrl: "",
      imageUrls: [],
      mileage: undefined,
      year: undefined,
      price: undefined,
    },
  });

  const mainCategory = form.watch("mainCategory");
  const subCategory = form.watch("subCategory");
  const isAutomotive = mainCategory === "Automotive";

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isAuthLoading, setLocation]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 20 - uploadedImages.length;
    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: t("maxPhotosReached"),
        description: t("maxPhotosDesc"),
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
          title: t("uploadFailed"),
          description: `${(error as any)?.name || ''} ${t("uploadFailedDesc")}`,
        });
      }
    }

    toast({
      title: t("photosUploaded"),
      description: `${filesToUpload.length} ${t("photosUploadedDesc")}`,
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
    const payload = {
      ...data,
      price: data.price ? Math.round(data.price) : undefined,
    };

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast({
          title: t("listingSubmitted"),
          description: t("listingUnderReview"),
        });
        setLocation("/");
      },
      onError: (err: any) => {
        if (err.code === "INSUFFICIENT_CREDITS") {
          toast({
            variant: "destructive",
            title: t("noCreditsTitle"),
            description: t("noCreditsDesc"),
          });
        } else {
          toast({
            variant: "destructive",
            title: t("error"),
            description: err.message,
          });
        }
      },
    });
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/">
              <button className={`p-2 ${isRTL ? '-mr-2' : '-ml-2'} rounded-lg hover:bg-secondary transition-colors`} data-testid="button-back">
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </Link>
            <h1 className={`flex-1 text-center font-semibold text-lg ${isRTL ? 'pl-8' : 'pr-8'}`}>{t("postListing")}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 max-w-2xl">
        {userInfo?.subscriptionEnabled && (
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-accent" />
                <span className="font-semibold">{t("yourCredits")}</span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <Wrench className="h-6 w-6 text-accent" />
                </div>
                <span className="text-2xl font-bold">{userInfo?.sparePartsCredits || 0}</span>
                <span className="text-sm text-muted-foreground">{t("spareParts")}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <Car className="h-6 w-6 text-accent" />
                </div>
                <span className="text-2xl font-bold">{userInfo?.automotiveCredits || 0}</span>
                <span className="text-sm text-muted-foreground">{t("automotive")}</span>
              </div>
            </div>
          </Card>
        )}

        {userInfo?.subscriptionEnabled && mainCategory && (
          (() => {
            const requiredCredits = mainCategory === "Spare Parts" 
              ? userInfo?.sparePartsCredits 
              : userInfo?.automotiveCredits;
            return requiredCredits < 1 ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("noCreditsFor")} {mainCategory === "Spare Parts" ? t("spareParts") : t("automotive")} {t("creditsWord")}</AlertTitle>
                <AlertDescription>
                  {t("needAtLeast1Credit")} {mainCategory === "Spare Parts" ? t("spareParts") : t("automotive")} {t("creditToPost")}
                </AlertDescription>
              </Alert>
            ) : null;
          })()
        )}

        <div className="bg-card border border-border shadow-lg rounded-xl p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("category")}
                </h3>
                
                <CategoryCombobox
                  isPosting={true}
                  mainCategory={mainCategory}
                  subCategory={subCategory}
                  onMainCategoryChange={(value) => {
                    form.setValue("mainCategory", value, { shouldValidate: true });
                    form.setValue("mileage", undefined);
                    form.setValue("year", undefined);
                  }}
                  onSubCategoryChange={(value) => {
                    form.setValue("subCategory", value, { shouldValidate: true });
                    form.setValue("model", "");
                  }}
                />
                
                {form.formState.errors.mainCategory && (
                  <p className="text-sm text-destructive">{form.formState.errors.mainCategory.message}</p>
                )}
                {form.formState.errors.subCategory && (
                  <p className="text-sm text-destructive">{form.formState.errors.subCategory.message}</p>
                )}
                
                {subCategory && CAR_MODELS[subCategory] && (
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("modelOptional")}</FormLabel>
                        <FormControl>
                          <select
                            className="w-full h-12 px-3 rounded-lg border border-border bg-background text-foreground"
                            data-testid="select-model"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">{t("selectModel")}</option>
                            {CAR_MODELS[subCategory].map((model) => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      {isAutomotive ? t("vehicleDetails") : t("partDetails")}
                    </span>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("title")}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={isAutomotive ? t("titlePlaceholderAuto") : t("titlePlaceholderParts")} 
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
                        <FormLabel>{t("uploadPhotos")} ({uploadedImages.length}/20)</FormLabel>
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
                                        <div className={`absolute top-1 ${isRTL ? 'right-1' : 'left-1'} bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded`}>
                                          {t("main")}
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors`}
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
                                  {isUploading ? t("uploading") : t("uploadPhotos")}
                                </Button>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {t("photoFormatNote")}
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
                            <FormLabel>{t("year")}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={t("yearPlaceholder")} 
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
                            <FormLabel>{t("mileageKm")}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder={t("mileagePlaceholder")} 
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
                        <FormLabel>{t("description")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={isAutomotive 
                              ? t("descPlaceholderAuto") 
                              : t("descPlaceholderParts")
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

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("priceAED")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={t("pricePlaceholder")} 
                            className="h-12" 
                            data-testid="input-price"
                            {...field}
                            value={field.value || ""}
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
                      disabled={createProduct.isPending || isUploading}
                      data-testid="button-publish"
                    >
                      {createProduct.isPending ? (
                        <>
                          <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5 animate-spin`} /> {t("submitting")}
                        </>
                      ) : (
                        t("submitListing")
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      <Clock className={`inline h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t("listingsReviewed")}
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