import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="prose-invert"
      >
        <PageHeader compact title="Privacy policy" subtitle="Last updated: 28 August 2026" />

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Who we are</h2>
            <p>
              CASCADE Events is operated by the Department of CSE & AI at GHRSTU. This policy
              explains how we collect and use information when you create an account, register for
              events, or make a payment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-400">
              <li>Account details: name, email, and a hashed password.</li>
              <li>Registration answers you submit for a specific event.</li>
              <li>Payment references from Razorpay when an event has a fee (we do not store card numbers).</li>
              <li>Basic technical logs needed to run and secure the site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">How we use it</h2>
            <p>
              We use your data to run your account, process registrations and payments, send
              transactional email (for example a welcome message), and improve event operations.
              Organizers can see registrations for events they manage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Cookies</h2>
            <p>
              Essential storage keeps you signed in (your session token). If you accept cookies, we
              may also remember your email on this device so you do not have to retype it at login.
              You can decline optional cookies; login will still work.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Sharing</h2>
            <p>
              We share data with service providers only as needed: hosting, database, file storage,
              email delivery, and Razorpay for payments. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Retention and your choices</h2>
            <p>
              We keep account and registration records for as long as needed to run CASCADE Events
              and meet institutional records requirements. Contact the CASCADE organizers at GHRSTU
              if you need help accessing or correcting your account details.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link to="/faq" className="text-cascade-purple hover:underline">
            Read FAQs
          </Link>
          <span className="text-gray-600 mx-2">·</span>
          <Link to="/" className="text-cascade-purple hover:underline">
            Back to events
          </Link>
        </p>
      </motion.article>
    </div>
  )
}
