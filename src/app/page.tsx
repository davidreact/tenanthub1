import Footer from "@/components/footer";
import Hero from "@/components/hero";
import {
  ArrowUpRight,
  CheckCircle2,
  Shield,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Key,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Hero />
      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Complete Tenant Management Solution
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Streamline your property management with our comprehensive
              platform designed for modern landlords and tenants.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Inventory Management",
                description:
                  "Upload, review, and annotate property inventory with tenant collaboration",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Secure Authentication",
                description:
                  "Bank-grade security for tenant data and documents",
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: "Payment Tracking",
                description: "Upload payment proofs and track payment history",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Key Handover Scheduling",
                description: "Coordinate move-in/move-out dates seamlessly",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to get started with your tenant management portal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up & Login</h3>
              <p className="text-gray-600">
                Create your secure tenant account and access your personalized
                dashboard
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Manage Your Property
              </h3>
              <p className="text-gray-600">
                Review inventory, upload documents, and track your lease
                information
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Connected</h3>
              <p className="text-gray-600">
                Schedule appointments, submit payments, and communicate with
                property managers
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Properties Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Happy Tenants</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guaranteed</div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Streamline Your Tenancy?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of tenants who trust us with their property management
            needs.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Access Your Portal
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>
      <Footer />
    </div>
  );
}
