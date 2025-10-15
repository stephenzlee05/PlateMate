[@concept-design-overview](../background/concept-design-overview.md)

# question: how do concepts compare to OOP?
# response:

Concept Design and Object-Oriented Programming (OOP) are both approaches to structuring software, but they differ significantly in their fundamental units of modularity, how they separate concerns, manage state, and compose functionality.

Here's a comparison:

## Similarities

*   **Modularity and Reuse:** Both aim to break down complex systems into smaller, manageable, and reusable units.
*   **State and Behavior:** Both approaches deal with managing state and defining behavior that operates on that state.
*   **Abstraction:** Both facilitate abstraction by hiding implementation details behind defined interfaces (APIs in concepts, public methods in OOP classes).
*   **Polymorphism:** While applied differently, both can leverage polymorphism to allow more flexible and generalized interactions.

## Key Differences

1.  **Primary Unit of Modularity:**
    *   **Concepts:** The fundamental unit is a "reusable unit of user-facing functionality that serves a well-defined and intelligible purpose." This unit often spans multiple "entity" types, focusing on a *behavioral protocol* or a *function* (e.g., *Upvote*, *RestaurantReservation*).
    *   **OOP:** The fundamental unit is the **class** (and objects instantiated from it), which encapsulates *data (attributes)* and the *behavior (methods)* related to a specific "entity" or "kind of thing" (e.g., a `User` class, a `Post` class, a `Comment` class).

2.  **Separation of Concerns (Granularity):**
    *   **Concepts:** Enforces a *very strict* separation of concerns around *functionality and purpose*. Each concept addresses only a single, coherent aspect of the application's behavior. This means that functionality often associated with a single "object" in OOP is split into multiple independent concepts (e.g., `UserAuthentication`, `Profile`, `Notification` concepts instead of a single `User` class).
    *   **OOP:** While OOP promotes separation of concerns (e.g., via Single Responsibility Principle, design patterns), it often naturally conflates concerns *around an entity*. A `User` class might commonly manage authentication, profile details, and notification preferences, leading to a "god object" anti-pattern if not carefully managed.

3.  **State Management:**
    *   **Concepts:** A concept maintains its *own state*, which typically involves objects of *several different kinds* and the *relationships between them*. This state is sufficient for the concept's behavior but no richer than needed. The state for an "entity" (like a user) is *distributed* across multiple concepts that use parts of that entity's data (e.g., *UserAuthentication* has user IDs and passwords; *Profile* has user IDs and bios).
    *   **OOP:** State is typically *encapsulated within a single object* or class instance. An object holds its own attributes, and relationships to other objects are managed through references or compositions *within* that object or its associated "manager" objects. The state for an "entity" tends to be *centralized* in its corresponding object.

4.  **Inter-Module Communication and Composition:**
    *   **Concepts:** Concepts are *mutually independent* and *cannot directly refer to or use each other's services*. Composition happens *externally* through **synchronizations (syncs)**. A sync is a rule (`when X happens in Concept A, where Y is true in Concept B, then Z happens in Concept C`) that orchestrates actions across concepts, effectively defining dependencies without violating the concepts' internal independence.
    *   **OOP:** Objects interact through *direct method calls* or *message passing*. This creates direct dependencies and coupling between objects. Composition is achieved via aggregation, composition (one object "has-a" another), or inheritance (one class "is-a" another), which tightly links components.

5.  **Completeness and Independence:**
    *   **Concepts:** A core principle is *complete independence*. "Each concept is defined without reference to any other concepts, and can be understood in isolation." A concept is also "complete with respect to its functionality and doesn't rely on functionality from other concepts."
    *   **OOP:** While striving for loose coupling, objects often have direct dependencies on other objects to perform their functions. A method in one class will typically call methods in other classes. Inheritance, while a powerful reuse mechanism, creates very strong coupling.

6.  **Focus and Perspective:**
    *   **Concepts:** Emphasizes "user-facing functionality" and "human behavioral protocols." The modular units are designed to be "archetypal" and familiar to users. Design knowledge and user experience are central.
    *   **OOP:** Primarily a developer-centric paradigm, focusing on modeling the problem domain in terms of data structures and algorithms. While it ultimately serves users, the units of modularity (classes/objects) are not inherently tied to "user-facing functionality" or "human behavioral protocols" in the same explicit way.

In essence, while OOP builds systems by combining interacting *entities* (objects) that encapsulate their own data and behavior, **Concept Design** builds systems by orchestrating independent, self-contained *functional behaviors* (concepts) that manage their own slice of the application's overall state, with interactions mediated through external synchronization rules. This leads to a different kind of modularity that prioritizes independence, reuse of behavioral patterns, and a clearer separation of concerns around *what the system does* rather than *what the system has*.