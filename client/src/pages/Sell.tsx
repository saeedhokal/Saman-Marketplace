import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useCreateProduct } from "@/hooks/use-products";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/hooks/use-auth";
import { insertProductSchema } from "@shared/schema";
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
import { Loader2, UploadCloud, AlertCircle, Coins, Clock, Car, Wrench, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { CategoryCombobox } from "@/components/CategoryCombobox";

const formSchema = insertProductSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().min(1, "Product image is required"),
  mainCategory: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  mileage: z.coerce.number().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  price: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Sell() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProduct = useCreateProduct();
  const { uploadFile, isUploading, progress } = useUpload();

  const { data: userInfo } = useQuery<{ 
    sparePartsCredits: number; 
    automotiveCredits: number; 
    isAdmin: boolean;
    subscriptionEnabled: boolean;
  }>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      mainCategory: "",
      subCategory: "",
      imageUrl: "",
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
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      if (result) {
        form.setValue("imageUrl", result.objectPath, { shouldValidate: true });
        toast({
          title: "Image uploaded",
          description: "Your photo has been uploaded successfully.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
    }
  };

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      price: data.price ? Math.round(data.price * 100) : undefined,
    };

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Listing Submitted!",
          description: "Your listing is pending review. Once approved, it will be visible for 1 month.",
        });
        setLocation("/");
      },
      onError: (err: any) => {
        if (err.code === "INSUFFICIENT_CREDITS") {
          toast({
            variant: "destructive",
            title: "No Credits",
            description: "You need credits to post a listing. Please purchase credits.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
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
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Post Listing</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 max-w-2xl">
        {userInfo?.subscriptionEnabled && (
          <div className="mb-4 flex flex-col gap-2 p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-accent" />
                <span className="text-sm">Spare Parts Credits</span>
              </div>
              <span className="text-sm font-semibold">{userInfo?.sparePartsCredits || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-accent" />
                <span className="text-sm">Automotive Credits</span>
              </div>
              <span className="text-sm font-semibold">{userInfo?.automotiveCredits || 0}</span>
            </div>
          </div>
        )}

        {userInfo?.subscriptionEnabled && mainCategory && (
          (() => {
            const requiredCredits = mainCategory === "Spare Parts" 
              ? userInfo?.sparePartsCredits 
              : userInfo?.automotiveCredits;
            return requiredCredits < 1 ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No {mainCategory} Credits</AlertTitle>
                <AlertDescription>
                  You need at least 1 {mainCategory} credit to post this listing.
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
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          <div>
                            <Input type="hidden" {...field} />
                            
                            {field.value ? (
                              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border group">
                                <img 
                                  src={field.value} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button 
                                    type="button"
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => form.setValue("imageUrl", "", { shouldValidate: true })}
                                    data-testid="button-remove-image"
                                  >
                                    Remove
                                  </Button>
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
                                  />
                                  {isUploading ? "Uploading..." : "Upload Photo"}
                                </Button>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  JPG, PNG up to 5MB
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
                      disabled={createProduct.isPending || isUploading}
                      data-testid="button-publish"
                    >
                      {createProduct.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Submit Listing"
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      <Clock className="inline h-3 w-3 mr-1" />
                      Listings are reviewed before going live
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
