export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      customer_reviews: {
        Row: {
          comment: string;
          created_at: string;
          id: string;
          is_published: boolean;
          nickname: string;
          rating: number;
          service_type: string | null;
        };
        Insert: {
          comment: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          nickname?: string;
          rating: number;
          service_type?: string | null;
        };
        Update: {
          comment?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          nickname?: string;
          rating?: number;
          service_type?: string | null;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          created_at: string;
          display_order: number;
          id: string;
          is_active: boolean;
          question: string;
          updated_at: string;
        };
        Insert: {
          answer: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          question: string;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          question?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_items: {
        Row: {
          created_at: string;
          id: string;
          is_published: boolean;
          name: string;
          price_won: number | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_published?: boolean;
          name: string;
          price_won?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_published?: boolean;
          name?: string;
          price_won?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          created_at: string;
          id: string;
          image_path: string;
          is_published: boolean;
          link_url: string;
          summary: string;
          tags: string[];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_path?: string;
          is_published?: boolean;
          link_url?: string;
          summary: string;
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_path?: string;
          is_published?: boolean;
          link_url?: string;
          summary?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          detail_image_after_path: string;
          detail_image_path: string;
          id: string;
          image_after_focal_x: number;
          image_after_focal_y: number;
          image_after_path: string;
          image_focal_x: number;
          image_focal_y: number;
          image_path: string;
          is_published: boolean;
          sort_order: number;
          tags: string[] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string;
          detail_image_after_path?: string;
          detail_image_path?: string;
          id?: string;
          image_after_focal_x?: number;
          image_after_focal_y?: number;
          image_after_path?: string;
          image_focal_x?: number;
          image_focal_y?: number;
          image_path?: string;
          is_published?: boolean;
          sort_order?: number;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          detail_image_after_path?: string;
          detail_image_path?: string;
          id?: string;
          image_after_focal_x?: number;
          image_after_focal_y?: number;
          image_after_path?: string;
          image_focal_x?: number;
          image_focal_y?: number;
          image_path?: string;
          is_published?: boolean;
          sort_order?: number;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_config: {
        Row: {
          address: string;
          address_locality: string;
          address_region: string;
          blog_url: string;
          business_name: string;
          business_registration_number: string | null;
          customer_review_description: string | null;
          daangn_url: string;
          description: string;
          email: string;
          faq_description: string | null;
          hero_image_focal_x: number | null;
          hero_image_focal_x_2: number | null;
          hero_image_focal_y: number | null;
          hero_image_focal_y_2: number | null;
          hero_image_path: string | null;
          hero_image_path_2: string | null;
          id: string;
          instagram_url: string;
          moving_address: string;
          moving_business_registration_number: string | null;
          moving_phone: string;
          moving_representative: string;
          phone: string;
          price_description: string | null;
          representative: string;
          review_description: string | null;
          service_description: string | null;
          site_url: string;
          updated_at: string;
        };
        Insert: {
          address?: string;
          address_locality?: string;
          address_region?: string;
          blog_url?: string;
          business_name?: string;
          business_registration_number?: string | null;
          customer_review_description?: string | null;
          daangn_url?: string;
          description?: string;
          email?: string;
          faq_description?: string | null;
          hero_image_focal_x?: number | null;
          hero_image_focal_x_2?: number | null;
          hero_image_focal_y?: number | null;
          hero_image_focal_y_2?: number | null;
          hero_image_path?: string | null;
          hero_image_path_2?: string | null;
          id?: string;
          instagram_url?: string;
          moving_address?: string;
          moving_business_registration_number?: string | null;
          moving_phone?: string;
          moving_representative?: string;
          phone?: string;
          price_description?: string | null;
          representative?: string;
          review_description?: string | null;
          service_description?: string | null;
          site_url?: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          address_locality?: string;
          address_region?: string;
          blog_url?: string;
          business_name?: string;
          business_registration_number?: string | null;
          customer_review_description?: string | null;
          daangn_url?: string;
          description?: string;
          email?: string;
          faq_description?: string | null;
          hero_image_focal_x?: number | null;
          hero_image_focal_x_2?: number | null;
          hero_image_focal_y?: number | null;
          hero_image_focal_y_2?: number | null;
          hero_image_path?: string | null;
          hero_image_path_2?: string | null;
          id?: string;
          instagram_url?: string;
          moving_address?: string;
          moving_business_registration_number?: string | null;
          moving_phone?: string;
          moving_representative?: string;
          phone?: string;
          price_description?: string | null;
          representative?: string;
          review_description?: string | null;
          service_description?: string | null;
          site_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_public_review: {
        Args: {
          p_comment: string;
          p_nickname?: string;
          p_rating: number;
          p_service_type?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type SiteConfigRow = Database["public"]["Tables"]["site_config"]["Row"];
export type SiteConfigUpdate =
  Database["public"]["Tables"]["site_config"]["Update"];

export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export type SiteConfig = SiteConfigRow;
export type Review = ReviewRow;
export type Service = ServiceRow;

export type FaqRow = Database["public"]["Tables"]["faqs"]["Row"];
export type FaqInsert = Database["public"]["Tables"]["faqs"]["Insert"];
export type FaqUpdate = Database["public"]["Tables"]["faqs"]["Update"];

export type CustomerReviewRow =
  Database["public"]["Tables"]["customer_reviews"]["Row"];
export type CustomerReviewInsert =
  Database["public"]["Tables"]["customer_reviews"]["Insert"];

export type PriceItemRow = Database["public"]["Tables"]["price_items"]["Row"];
export type PriceItemInsert =
  Database["public"]["Tables"]["price_items"]["Insert"];
export type PriceItemUpdate =
  Database["public"]["Tables"]["price_items"]["Update"];
