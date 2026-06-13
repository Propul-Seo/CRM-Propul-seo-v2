import { createClient } from "npm:@supabase/supabase-js@2.39.0";

// Types for the quote data
interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteData {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  validUntil: string;
  createdAt: string;
  quoteNumber?: string;
}

// PDF generation API configuration
const PDF_API_URL = "https://api.pdfmonkey.io/api/v1/documents";
const PDF_API_KEY = Deno.env.get("PDF_API_KEY") || "";

// Supabase configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get the user from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No auth header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body
    const { quoteData } = await req.json();

    if (!quoteData) {
      return new Response(
        JSON.stringify({ error: "Missing quote data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a quote number if not provided
    if (!quoteData.quoteNumber) {
      quoteData.quoteNumber = `PROP-QUO-${Date.now()}`;
    }

    // Step 1: Generate the PDF using the external API
    const pdfResponse = await generatePDF(quoteData);
    
    if (!pdfResponse.success) {
      return new Response(
        JSON.stringify({ error: pdfResponse.error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Upload the PDF to Supabase Storage
    const pdfBuffer = pdfResponse.pdfBuffer;
    const fileName = `${user.id}/${quoteData.quoteNumber.replace(/\s+/g, '_')}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('devis')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Error uploading PDF: ${uploadError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('devis')
      .getPublicUrl(fileName);

    // Step 4: Return the URL and success message
    return new Response(
      JSON.stringify({
        success: true,
        message: "Quote PDF generated and stored successfully",
        pdfUrl: publicUrl,
        fileName: fileName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate_quote_pdf function:", error);
    
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Generate a PDF using the external API
 */
async function generatePDF(quoteData: QuoteData): Promise<{ success: boolean; pdfBuffer?: Uint8Array; error?: string }> {
  try {
    // First, create a document in the PDF API
    const createDocumentResponse = await fetch(PDF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PDF_API_KEY}`
      },
      body: JSON.stringify({
        document: {
          document_template_id: "template_123", // Replace with your actual template ID
          payload: {
            quote: quoteData,
            company: {
              name: "Propulseo",
              address: "15 rue de l'Innovation, 75001 Paris",
              email: "contact@propulseo.com",
              phone: "+33 1 23 45 67 89",
              website: "https://propulseo.com",
              logo: "https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm"
            }
          },
          status: "pending"
        }
      })
    });

    if (!createDocumentResponse.ok) {
      const errorData = await createDocumentResponse.json();
      return { 
        success: false, 
        error: `Error creating document: ${JSON.stringify(errorData)}` 
      };
    }

    const documentData = await createDocumentResponse.json();
    const documentId = documentData.document.id;

    // Wait for the document to be generated (polling)
    let documentStatus = "pending";
    const maxAttempts = 10;
    let attempts = 0;
    
    while (documentStatus === "pending" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`${PDF_API_URL}/${documentId}`, {
        headers: {
          "Authorization": `Bearer ${PDF_API_KEY}`
        }
      });
      
      if (!statusResponse.ok) {
        return { 
          success: false, 
          error: `Error checking document status: ${statusResponse.statusText}` 
        };
      }
      
      const statusData = await statusResponse.json();
      documentStatus = statusData.document.status;
      attempts++;
    }
    
    if (documentStatus !== "success") {
      return { 
        success: false, 
        error: `Document generation failed or timed out. Status: ${documentStatus}` 
      };
    }

    // Download the generated PDF
    const downloadResponse = await fetch(`${PDF_API_URL}/${documentId}/download`, {
      headers: {
        "Authorization": `Bearer ${PDF_API_KEY}`
      }
    });
    
    if (!downloadResponse.ok) {
      return { 
        success: false, 
        error: `Error downloading PDF: ${downloadResponse.statusText}` 
      };
    }
    
    const pdfBuffer = new Uint8Array(await downloadResponse.arrayBuffer());
    
    return {
      success: true,
      pdfBuffer
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return {
      success: false,
      error: `Error generating PDF: ${error.message}`
    };
  }
}