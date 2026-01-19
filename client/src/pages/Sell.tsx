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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, UploadCloud, AlertCircle, Coins, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryCombobox } from "@/components/CategoryCombobox";

const formSchema = insertProductSchema.extend({
  price: z.coerce.number().min(1, "Price is required"),
  imageUrl: z.string().min(1, "Product image is required"),
  mainCategory: z.string().min(1, "Main category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CONDITIONS = ["New", "Used", "Refurbished"];

export default function Sell() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProduct = useCreateProduct();
  const { uploadFile, isUploading, progress } = useUpload();
  const { data: userInfo } = useQuery<{ credits: number; isAdmin: boolean }>({
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
      condition: "",
      imageUrl: "",
      price: undefined,
      phoneNumber: "",
      whatsappNumber: "",
      location: "",
    },
  });

  const mainCategory = form.watch("mainCategory");
  const subCategory = form.watch("subCategory");

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
        form.setValue("imageUrl", result.objectPath);
        toast({
          title: "Image uploaded",
          description: "Your product image has been uploaded successfully.",
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
    if (!userInfo || userInfo.credits < 1) {
      toast({
        variant: "destructive",
        title: "No Credits",
        description: "You need at least 1 credit to post a listing. Please purchase credits.",
      });
      return;
    }

    const payload = {
      ...data,
      price: Math.round(data.price * 100),
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Post Your Listing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Fill in the details below to reach potential buyers in the UAE.
          </p>
        </div>

        {/* Credits Info */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <Card className="inline-flex items-center gap-2 px-4 py-2">
            <Coins className="h-5 w-5 text-accent" />
            <span className="font-medium">{userInfo?.credits || 0} Credits Available</span>
          </Card>
        </div>

        {(!userInfo || userInfo.credits < 1) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Credits</AlertTitle>
            <AlertDescription>
              You need at least 1 credit to post a listing. Each listing costs 1 credit and remains active for 1 month after approval.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Review Process</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            All listings are reviewed before going live. Once approved, your listing will be visible for 1 month. Each listing uses 1 credit.
          </AlertDescription>
        </Alert>

        <div className="bg-card border border-border shadow-xl shadow-black/5 rounded-2xl p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Category</h3>
                
                <CategoryCombobox
                  mainCategory={mainCategory}
                  subCategory={subCategory}
                  onMainCategoryChange={(value) => form.setValue("mainCategory", value, { shouldValidate: true })}
                  onSubCategoryChange={(value) => form.setValue("subCategory", value, { shouldValidate: true })}
                />
                
                {form.formState.errors.mainCategory && (
                  <p className="text-sm text-destructive">{form.formState.errors.mainCategory.message}</p>
                )}
                {form.formState.errors.subCategory && (
                  <p className="text-sm text-destructive">{form.formState.errors.subCategory.message}</p>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 2018 Toyota Camry Bumper - OEM" 
                          className="h-12" 
                          data-testid="input-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12" data-testid="select-condition">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONDITIONS.map((cond) => (
                              <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (AED)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">AED</span>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              className="pl-12 h-12 font-mono" 
                              data-testid="input-price"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Description</h3>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the condition, compatibility, defects, and any other details..." 
                          className="min-h-[150px] resize-none leading-relaxed" 
                          data-testid="input-description"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+971 50 123 4567" 
                            className="h-12" 
                            data-testid="input-phone"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Buyers can call this number directly
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+971 50 123 4567" 
                            className="h-12" 
                            data-testid="input-whatsapp"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include country code for WhatsApp
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Dubai, Abu Dhabi, Sharjah" 
                          className="h-12" 
                          data-testid="input-location"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Product Image</h3>
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Photo</FormLabel>
                      <FormControl>
                        <div className="grid gap-4">
                          <Input 
                            type="hidden" 
                            {...field} 
                          />
                          
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
                                  onClick={() => form.setValue("imageUrl", "")}
                                  data-testid="button-remove-image"
                                >
                                  Remove Image
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 transition-colors hover:border-primary/50 hover:bg-secondary/20">
                              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                                {isUploading ? (
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="text-center">
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
                                  {isUploading ? "Uploading..." : "Select Image"}
                                </Button>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  JPG, PNG or WEBP up to 5MB
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {isUploading && (
                            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
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
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                  disabled={createProduct.isPending || isUploading}
                  data-testid="button-publish"
                >
                  {createProduct.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing...
                    </>
                  ) : (
                    "Publish Listing"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
