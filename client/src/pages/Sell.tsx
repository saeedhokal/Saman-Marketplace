import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { useEffect } from "react";

// Frontend form schema - handle string to number conversion for price
const formSchema = insertProductSchema.extend({
  price: z.coerce.number().min(1, "Price is required"),
  imageUrl: z.string().min(1, "Product image is required"),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES = ["Engine", "Body", "Electrical", "Interior", "Wheels", "Other"];
const CONDITIONS = ["New", "Used", "Refurbished"];

export default function Sell() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProduct = useCreateProduct();
  const { uploadFile, isUploading, progress } = useUpload();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      condition: "",
      imageUrl: "",
      sellerId: "", // Will be set before submit
      price: undefined,
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      window.location.href = "/api/login";
    } else if (user) {
      form.setValue("sellerId", user.id);
    }
  }, [user, isAuthLoading, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      if (result) {
        // objectPath is already the full path like /objects/uploads/uuid
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
    // Convert price to cents
    const payload = {
      ...data,
      price: Math.round(data.price * 100),
    };

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Product Listed!",
          description: "Your part is now live on the marketplace.",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message,
        });
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
            List a Part for Sale
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Fill in the details below to reach thousands of potential buyers.
          </p>
        </div>

        <div className="bg-card border border-border shadow-xl shadow-black/5 rounded-2xl p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2018 Ford Mustang GT Bumper" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
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
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="pl-7 h-12 font-mono" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Details</h3>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the condition, compatibility, and any defects..." 
                          className="min-h-[150px] resize-none leading-relaxed" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Image Upload */}
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
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={() => form.setValue("imageUrl", "")}
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
