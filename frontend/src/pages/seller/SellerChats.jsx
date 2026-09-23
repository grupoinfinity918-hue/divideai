import KanbanBoard from '../../components/crm/KanbanBoard';

export default function SellerChats() {
  return (
    <div>
      <div className="da-container" style={{ paddingTop: 24 }}>
        <h2>Meus Atendimentos</h2>
      </div>
      <KanbanBoard />
    </div>
  );
}
