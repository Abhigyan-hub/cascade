import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const FAQS = [
  {
    q: 'How do I register for an event?',
    a: 'Open an event, sign in or create an account, then complete the registration form. Paid events continue to Razorpay after you submit.',
  },
  {
    q: 'Why do I need an account?',
    a: 'Your account stores registrations, payment status, and lets organizers confirm who is attending. Use the same email each time.',
  },
  {
    q: 'How do payments work?',
    a: 'Free events need no payment. For paid events we create a Razorpay order. After you pay, your registration is recorded with the payment reference.',
  },
  {
    q: 'Can I cancel a registration?',
    a: 'Contact the event organizer or CASCADE admins. Status (pending, accepted, rejected) is shown on your dashboard.',
  },
  {
    q: 'I did not get a welcome email.',
    a: 'Check spam. Email is sent after signup when the server is configured with Resend. Your account still works even if email is delayed.',
  },
  {
    q: 'Who can see my data?',
    a: 'You see your own dashboard. Event organizers and CASCADE admins can see registrations for events they manage. See our privacy policy for details.',
  },
]

function Item({ item, open, onToggle }) {
  return (
    <div className="border border-cascade-border rounded-xl overflow-hidden bg-cascade-surface">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="font-medium text-white">{item.q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader compact title="FAQs" subtitle="Common questions about CASCADE Events." />
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <Item
              key={item.q}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
        <p className="mt-10 text-sm text-gray-500">
          Still need help? Reach the CASCADE organizers at GHRSTU, or read the{' '}
          <Link to="/privacy" className="text-cascade-purple hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  )
}
