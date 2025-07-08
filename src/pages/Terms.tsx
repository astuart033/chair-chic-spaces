import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <Link to="/" className="flex items-center">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-3">
              <Scissors className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">ShearSpace</h1>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Terms of Service & User Agreement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <div>
              <h3 className="text-lg font-semibold mb-2">Acceptance of Terms</h3>
              <p>
                By using ShearSpace, you agree to these Terms of Service. If you do not agree to these terms, 
                please do not use our platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Platform Role & Liability Limitation</h3>
              <p>
                <strong>ShearSpace acts solely as a marketplace platform</strong> connecting salon owners with 
                cosmetologists and barbers seeking rental space. We are not a party to any rental agreements, 
                service arrangements, or transactions between users.
              </p>
              <p>
                <strong>IMPORTANT:</strong> By using this platform, both Renters and Salon Owners acknowledge 
                and agree that they take FULL RESPONSIBILITY for all services, interactions, and arrangements 
                between each other. This includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Quality and safety of services provided</li>
                <li>Professional licensing and compliance requirements</li>
                <li>Security of personal property and equipment</li>
                <li>Any injuries, damages, or losses that may occur</li>
                <li>Payment disputes and financial arrangements</li>
                <li>Theft, damage, or loss of property</li>
                <li>Professional misconduct or negligence</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">User Responsibilities</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Salon Owners agree to:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Maintain appropriate business licenses and insurance</li>
                    <li>Ensure their spaces meet all health and safety requirements</li>
                    <li>Provide accurate descriptions of their facilities</li>
                    <li>Handle all rental agreements and payments responsibly</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">Renters agree to:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Maintain appropriate professional licenses and insurance</li>
                    <li>Conduct themselves professionally and safely</li>
                    <li>Respect the property and equipment of salon owners</li>
                    <li>Comply with all applicable health and safety regulations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Disclaimer of Warranties</h3>
              <p>
                ShearSpace provides the platform "AS IS" without any warranties, express or implied. 
                We do not guarantee the accuracy, reliability, or quality of listings, user information, 
                or services provided through our platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
              <p>
                <strong>TO THE FULLEST EXTENT PERMITTED BY LAW, SHEARSPACE SHALL NOT BE LIABLE FOR ANY:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Direct, indirect, incidental, special, or consequential damages</li>
                <li>Personal injuries or property damage occurring at rental locations</li>
                <li>Theft, loss, or damage to personal property or equipment</li>
                <li>Professional disputes between users</li>
                <li>Financial losses resulting from user interactions</li>
                <li>Breach of contract between users</li>
                <li>Any claims arising from services provided by renters</li>
              </ul>
              <p>
                Users acknowledge that they participate in rental arrangements at their own risk and 
                are solely responsible for their own safety and security.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Indemnification</h3>
              <p>
                Users agree to indemnify and hold harmless ShearSpace, its officers, directors, employees, 
                and agents from any claims, damages, losses, or expenses arising from their use of the platform 
                or their interactions with other users.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Insurance Recommendation</h3>
              <p>
                We strongly recommend that all users maintain appropriate professional liability insurance, 
                general liability insurance, and property insurance to protect themselves and their business interests.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Dispute Resolution</h3>
              <p>
                ShearSpace is not responsible for mediating or resolving disputes between users. 
                Users are encouraged to resolve conflicts directly or through appropriate legal channels.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Changes to Terms</h3>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the platform 
                constitutes acceptance of any changes.
              </p>
            </div>

            <div className="border-t pt-4 mt-8">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}