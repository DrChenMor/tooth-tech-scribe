import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Subscriber = Database['public']['Tables']['subscribers']['Row'];
type SubscriberInsert = Database['public']['Tables']['subscribers']['Insert'];
type SubscriberUpdate = Database['public']['Tables']['subscribers']['Update'];

export interface SubscribeResult {
  success: boolean;
  message: string;
  subscriber?: Subscriber;
}

export interface UnsubscribeResult {
  success: boolean;
  message: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate email format
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

// Send welcome email
const sendWelcomeEmail = async (email: string, name?: string): Promise<void> => {
  try {
    const functionUrl = 'https://nuhjsrmkkqtecfkjrcox.supabase.co/functions/v1/send-welcome-email';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGpzcm1ra3F0ZWNma2pyY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDU5MzksImV4cCI6MjA2NTQ4MTkzOX0.UZ4WC-Rgg3AUNmh91xTCMkmjr_v9UHR5TFO5TFZRq04`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGpzcm1ra3F0ZWNma2pyY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDU5MzksImV4cCI6MjA2NTQ4MTkzOX0.UZ4WC-Rgg3AUNmh91xTCMkmjr_v9UHR5TFO5TFZRq04'
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      console.error('Failed to send welcome email:', response.statusText);
      // Don't throw error - welcome email failure shouldn't break subscription
    } else {
      console.log('Welcome email sent successfully');
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - welcome email failure shouldn't break subscription
  }
};

// ✅ FIXED: Subscribe to newsletter with better error handling
export const subscribeToNewsletter = async (
  email: string, 
  name?: string
): Promise<SubscribeResult> => {
  try {
    // Validate email
    if (!validateEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address.'
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // ✅ FIXED: Check if already subscribed first
    const { data: existingSubscribers, error: checkError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', cleanEmail)
      .limit(1);

    if (checkError) {
      console.error('Error checking subscription:', checkError);
      return {
        success: false,
        message: 'Error checking subscription status. Please try again.'
      };
    }

    const existingSubscriber = existingSubscribers?.[0];

    // If already subscribed and active
    if (existingSubscriber && existingSubscriber.is_active) {
      return {
        success: false,
        message: 'You are already subscribed to our newsletter!'
      };
    }

    // If exists but unsubscribed, reactivate
    if (existingSubscriber && !existingSubscriber.is_active) {
      const { data: updatedSubscriber, error: updateError } = await supabase
        .from('subscribers')
        .update({
          is_active: true,
          unsubscribed_at: null,
          name: name?.trim() || existingSubscriber.name,
          updated_at: new Date().toISOString()
        } as SubscriberUpdate)
        .eq('id', existingSubscriber.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error reactivating subscription:', updateError);
        return {
          success: false,
          message: 'Error reactivating subscription. Please try again.'
        };
      }

      // Send welcome back email
      await sendWelcomeEmail(cleanEmail, name);

      return {
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.',
        subscriber: updatedSubscriber
      };
    }

    // ✅ FIXED: Create new subscription with proper error handling
    const { data: newSubscriber, error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email: cleanEmail,
        name: name?.trim() || null,
        is_active: true,
        subscribed_at: new Date().toISOString()
      } as SubscriberInsert)
      .select()
      .single();

    if (insertError) {
      console.error('Newsletter subscription error:', insertError);
      
      // Handle specific error cases
      if (insertError.code === '23505') { // Unique constraint violation
        // Try to update existing record to reactivate
        const { data: updatedSubscriber, error: updateError } = await supabase
          .from('subscribers')
          .update({
            is_active: true,
            unsubscribed_at: null,
            name: name?.trim() || null,
            updated_at: new Date().toISOString()
          } as SubscriberUpdate)
          .eq('email', cleanEmail)
          .select()
          .single();

        if (updateError) {
          return {
            success: false,
            message: 'This email is already subscribed to our newsletter.'
          };
        }

        // Send welcome back email
        await sendWelcomeEmail(cleanEmail, name);

        return {
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          subscriber: updatedSubscriber
        };
      }
      
      return {
        success: false,
        message: 'Error subscribing to newsletter. Please try again.'
      };
    }

    // Send welcome email for new subscribers
    await sendWelcomeEmail(cleanEmail, name);

    return {
      success: true,
      message: 'Successfully subscribed to our newsletter!',
      subscriber: newSubscriber
    };

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
};

// Unsubscribe from newsletter
export const unsubscribeFromNewsletter = async (email: string): Promise<UnsubscribeResult> => {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // For unsubscribe, we can use UPDATE directly without SELECT
    const { data, error: updateError } = await supabase
      .from('subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString()
      } as SubscriberUpdate)
      .eq('email', cleanEmail)
      .eq('is_active', true) // Only update if currently active
      .select();

    if (updateError) {
      console.error('Error unsubscribing:', updateError);
      return {
        success: false,
        message: 'Error unsubscribing. Please try again.'
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'Email not found or already unsubscribed.'
      };
    }

    return {
      success: true,
      message: 'Successfully unsubscribed from our newsletter.'
    };

  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
};

// Get all subscribers (admin only)
export const getAllSubscribers = async (): Promise<Subscriber[]> => {
  try {
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }

    return subscribers || [];
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }
};

// Get active subscribers count (admin only)
export const getActiveSubscribersCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching subscribers count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching subscribers count:', error);
    return 0;
  }
};