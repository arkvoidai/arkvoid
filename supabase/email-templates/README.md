# ARKVOID Supabase OTP email template

The hosted Supabase Auth email template for OTP/magic-link sign-in must render the one-time code with Supabase's `{{ .Token }}` variable. If the project template only includes copy and omits this token, users receive an email without the 6-digit code even though `signInWithOtp` succeeds.

Use `otp.html` as the body for the Supabase project's **Authentication → Email Templates → Magic Link / OTP** template, or ensure the current template contains a visible `{{ .Token }}` block.
