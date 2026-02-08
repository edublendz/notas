<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\InvoiceExpenseRepository')]
#[ORM\Table(name: 'invoice_expenses')]
class InvoiceExpense
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Invoice::class, inversedBy: 'expenses')]
    #[ORM\JoinColumn(name: 'invoice_id', referencedColumnName: 'id')]
    private Invoice $invoice;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Expense::class, inversedBy: 'invoiceExpenses')]
    #[ORM\JoinColumn(name: 'expense_id', referencedColumnName: 'id')]
    private Expense $expense;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    public function getInvoice(): Invoice { return $this->invoice; }
    public function setInvoice(Invoice $invoice): self { $this->invoice = $invoice; return $this; }
    public function getExpense(): Expense { return $this->expense; }
    public function setExpense(Expense $expense): self { $this->expense = $expense; return $this; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
}
