import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";

export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>This page does not exist.</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
