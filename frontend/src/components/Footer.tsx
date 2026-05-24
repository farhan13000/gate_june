import { Link } from "react-router-dom";
import { SiteContainer } from "@/components/layout";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-0 bg-background text-muted-foreground">
      <SiteContainer className="py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <h4 className="font-semibold text-foreground mb-2">GATE DA</h4>
          <p className="text-sm">Mathematically-driven practice and contests for GATE Data Science & AI aspirants. Focused, rigorous, and exam-aligned.</p>
        </div>

        <div>
          <h5 className="font-medium text-foreground mb-2">Resources</h5>
          <ul className="space-y-1 text-sm">
            <li><Link to="/problems" className="hover:underline">Problems</Link></li>
            <li><Link to="/contests" className="hover:underline">Contests</Link></li>
            <li><Link to="/theory" className="hover:underline">Theory</Link></li>
            <li><Link to="/leaderboard" className="hover:underline">Leaderboard</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-medium text-foreground mb-2">Company</h5>
          <ul className="space-y-1 text-sm">
            <li><a href="#" className="hover:underline">About</a></li>
            <li><a href="#" className="hover:underline">Careers</a></li>
            <li><a href="#" className="hover:underline">Contact</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-medium text-foreground mb-2">Contact Us</h5>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const data = new FormData(form);
              const payload = {
                name: data.get("name"),
                email: data.get("email"),
                message: data.get("message"),
              };
              // Try sending to backend; if it fails, fallback to mailto
              fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                .then(r => {
                  if (!r.ok) throw new Error("no-endpoint");
                  alert("Message sent — thanks!");
                  form.reset();
                })
                .catch(() => {
                  const mailto = `mailto:support@gateda.example.org?subject=${encodeURIComponent("Contact from " + payload.name)}&body=${encodeURIComponent(String(payload.message) + "\n\nFrom: " + payload.email)}`;
                  window.location.href = mailto;
                });
            }}
          >
            <input name="name" placeholder="Your name" className="w-full mb-2 px-2 py-1 text-sm border border-border rounded-sm" />
            <input name="email" placeholder="Email" className="w-full mb-2 px-2 py-1 text-sm border border-border rounded-sm" />
            <textarea name="message" placeholder="Message" rows={3} className="w-full mb-2 px-2 py-1 text-sm border border-border rounded-sm" />
            <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-sm">Send</button>
          </form>
        </div>
      </SiteContainer>

      <div className="border-t border-border/50 mt-4">
        <SiteContainer className="py-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>© {new Date().getFullYear()} GATE DA — All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </SiteContainer>
      </div>
    </footer>
  );
}
